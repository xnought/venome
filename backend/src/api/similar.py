from fastapi import APIRouter
from ..api_types import SimilarProtein
from ..protein import (
    pdb_file_name,
    revert_pdb_filename,
)
from ..foldseek import easy_search

router = APIRouter()


@router.get("/similar-pdb/{protein_name:str}", response_model=list[SimilarProtein])
def get_pdb_proteins(protein_name: str):
    # query_name = pdb_file_name(protein_name)
    # target_folder = "src/data/pdbAlphaFold/"
    # similar = easy_search(query_name, target_folder, out_format=["target", "prob"])
    pass
    # return [SimilarProtein(name=revert_pdb_filename(s[0]), prob=s[1]) for s in similar]


@router.get("/similar-venome/{protein_name:str}", response_model=list[SimilarProtein])
def get_venome_proteins(protein_name: str):
    query_name = pdb_file_name(protein_name)
    target_folder = "src/data/pdbAlphaFold/"
    similar = easy_search(query_name, target_folder, out_format=["target", "prob"])
    return [SimilarProtein(name=revert_pdb_filename(s[0]), prob=s[1]) for s in similar]
