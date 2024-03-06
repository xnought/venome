from fastapi import APIRouter
from fastapi.exceptions import HTTPException
import logging as log
from ..db import Database, bytea_to_str
from ..api_types import CamelModel, ProteinEntry
from ..foldseek import easy_search
from .protein import stored_pdb_file_name

router = APIRouter()


class SimilarProtein(CamelModel):
    name: str
    prob: float
    evalue: float
    description: str = ""


class RangeFilter(CamelModel):
    min: int | float
    max: int | float


class SearchProteinsBody(CamelModel):
    query: str
    species_filter: str | None = None
    length_filter: RangeFilter | None = None
    mass_filter: RangeFilter | None = None


class SearchProteinsResults(CamelModel):
    total_found: int
    protein_entries: list[ProteinEntry]


def sanitize_query(query: str) -> str:
    log.warn("todo: sanitize query so we don't get sql injectioned in search.py")
    return query


def range_where_clause(column_name: str, filter: RangeFilter | None = None) -> str:
    if filter is None:
        return ""
    return f"{column_name} BETWEEN {filter.min} AND {filter.max}"


def category_where_clause(column_name: str, filter: str | None = None) -> str:
    if filter is None:
        return ""
    return f"{column_name} = '{filter}'"


def combine_where_clauses(clauses: list[str]) -> str:
    result = ""
    for i, c in enumerate(clauses):
        if c != "":
            result += c
            if i < len(clauses) - 1:
                result += " AND "
    return result


def get_descriptions(protein_names: list[str]):
    if len(protein_names) > 0:
        with Database() as db:
            list_names = str(protein_names)[
                1:-1
            ]  # parse out the [] brackets and keep everything inside
            query = f"""SELECT description FROM proteins WHERE name in ({list_names})"""
            entry_sql = db.execute_return(query)
            if entry_sql is not None:
                return [d[0] for d in entry_sql]
    return None


def gen_sql_filters(
    species_table: str,
    proteins_table: str,
    species_filter: str | None,
    length_filter: RangeFilter | None = None,
    mass_filter: RangeFilter | None = None,
) -> str:
    filters = [
        category_where_clause(f"{species_table}.name", species_filter),
        range_where_clause(f"{proteins_table}.length", length_filter),
        range_where_clause(f"{proteins_table}.mass", mass_filter),
    ]
    return " AND " + combine_where_clauses(filters) if any(filters) else ""


@router.post("/search/proteins", response_model=SearchProteinsResults)
def search_proteins(body: SearchProteinsBody):
    title_query = sanitize_query(body.query)
    with Database() as db:
        try:
            filter_clauses = gen_sql_filters(
                "species",
                "proteins_scores",
                body.species_filter,
                body.length_filter,
                body.mass_filter,
            )
            threshold = 0.05
            score_filter = (
                f"proteins_scores.name_score >= {threshold}"  # show only the scores > 0
                if len(title_query) > 0
                else "TRUE"  # show all scores
            )
            entries_query = """SELECT proteins_scores.name, 
                                      proteins_scores.description, 
                                      proteins_scores.length, 
                                      proteins_scores.mass, 
                                      species.name,
                                      proteins_scores.thumbnail
                                FROM (SELECT *, similarity(name, %s) as name_score FROM proteins) as proteins_scores
                                JOIN species ON species.id = proteins_scores.species_id
                                WHERE {} {}
                                ORDER BY proteins_scores.name_score DESC;
                                """.format(score_filter, filter_clauses)
            log.warn(filter_clauses)
            entries_result = db.execute_return(
                sanitize_query(entries_query),
                [
                    title_query,
                ],
            )
            if entries_result is not None:
                return SearchProteinsResults(
                    protein_entries=[
                        ProteinEntry(
                            name=name,
                            length=length,
                            mass=mass,
                            species_name=species_name,
                            thumbnail=bytea_to_str(thumbnail_bytes)
                            if thumbnail_bytes is not None
                            else None,
                            description=description,
                        )
                        for name, description, length, mass, species_name, thumbnail_bytes in entries_result
                    ],
                    total_found=len(entries_result),
                )
            else:
                raise HTTPException(status_code=500)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


@router.get("/search/range/length", response_model=RangeFilter)
def search_range_length():
    try:
        with Database() as db:
            query = """SELECT min(length), max(length) FROM proteins"""
            entry_sql = db.execute_return(query)
            if entry_sql is not None:
                return RangeFilter(min=entry_sql[0][0], max=entry_sql[0][1])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search/range/mass", response_model=RangeFilter)
def search_range_mass():
    try:
        with Database() as db:
            query = """SELECT min(mass), max(mass) FROM proteins"""
            entry_sql = db.execute_return(query)
            if entry_sql is not None:
                return RangeFilter(min=entry_sql[0][0], max=entry_sql[0][1])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search/species", response_model=list[str] | None)
def search_species():
    try:
        with Database() as db:
            query = """SELECT name as species_name FROM species"""
            entry_sql = db.execute_return(query)
            if entry_sql is not None:
                return [d[0] for d in entry_sql]
    except Exception:
        return


@router.get(
    "/search/venome/similar/{protein_name:str}",
    response_model=list[SimilarProtein],
)
def search_venome_similar(protein_name: str):
    venome_folder = "/app/src/data/pdbAlphaFold/"
    # ignore the first since it's itself as the most similar
    try:
        similar = easy_search(
            stored_pdb_file_name(protein_name),
            venome_folder,
            out_format="target,prob,evalue",
        )[1:]
        formatted = [
            SimilarProtein(name=name.rstrip(".pdb"), prob=prob, evalue=evalue)
            for [name, prob, evalue] in similar
        ]
    except Exception:
        raise HTTPException(404, "Foldseek not found on the system")

    try:
        # populate protein descriptions for the similar proteins
        descriptions = get_descriptions([s.name for s in formatted])
        if descriptions is not None:
            for f, d in zip(formatted, descriptions):
                f.description = d
    except Exception:
        raise HTTPException(500, "Error getting protein descriptions")

    return formatted
