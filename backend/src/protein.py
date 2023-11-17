import logging as log
import os
from base64 import b64decode
from io import StringIO

from Bio.PDB import PDBParser
from Bio.SeqUtils import molecular_weight, seq1

from .db import Database


def decode_base64(b64_header_and_data: str):
    """Converts a base64 string to bytes"""
    # only decode after the header (data:application/octet-stream;base64,)
    end_of_header = b64_header_and_data.index(",")
    b64_data_only = b64_header_and_data[end_of_header:]
    return b64decode(b64_data_only).decode("utf-8")


class PDB:
    def __init__(self, file_contents, name=""):
        self.name = name
        self.file_contents = file_contents

        try:
            self.parser = PDBParser()
            self.structure = self.parser.get_structure(
                id=name, file=StringIO(file_contents)
            )
        except Exception as e:
            raise e  # raise to the user who calls this PDB class

    @property
    def pdb_file_name(self):
        return f"{os.path.join('src/data/pdbAlphaFold', self.name)}.pdb"

    @property
    def num_amino_acids(self) -> int:
        return len(self.amino_acids())

    @property
    def mass_daltons(self):
        return molecular_weight(seq="".join(self.amino_acids()), seq_type="protein")

    def amino_acids(self, one_letter_code=True):
        return [
            seq1(residue.resname) if one_letter_code else residue.resname
            for residue in self.structure.get_residues()
        ]


class Protein:
    @staticmethod
    def parse_pdb(name: str, file_contents: str, encoding="str"):
        if encoding == "str":
            return PDB(file_contents, name)
        elif encoding == "b64":
            return PDB(decode_base64(file_contents), name)
        else:
            raise ValueError(f"Invalid encoding: {encoding}")

    @staticmethod
    def name_taken(name: str):
        """Checks if a protein name already exists in the database
        Returns: True if exists | False if not exists
        """
        with Database() as db:
            try:
                entry_sql = db.execute_return(
                    """SELECT name FROM proteins
                        WHERE name = %s""",
                    [name],
                )

                # if we got a result back
                return entry_sql is not None and len(entry_sql) != 0

            except Exception:
                return False

    @staticmethod
    def save(pdb: PDB):
        log.warn(pdb.pdb_file_name)
        try:
            with open(pdb.pdb_file_name, "w") as f:
                f.write(pdb.file_contents)
        except Exception:
            log.warn("could not save")
            raise Exception("Could not save pdb file")

        with Database() as db:
            try:
                db.execute(
                    """INSERT INTO proteins (name, length, mass) VALUES (%s, %s, %s);""",
                    [
                        pdb.name,
                        pdb.num_amino_acids,
                        pdb.mass_daltons,
                    ],
                )
            except Exception as e:
                raise e
