/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Article } from '../models/Article';
import type { ArticleUpload } from '../models/ArticleUpload';
import type { EditArticle } from '../models/EditArticle';
import type { EditArticleImageComponent } from '../models/EditArticleImageComponent';
import type { EditArticleProteinComponent } from '../models/EditArticleProteinComponent';
import type { EditArticleTextComponent } from '../models/EditArticleTextComponent';
import type { EditBody } from '../models/EditBody';
import type { InsertComponent } from '../models/InsertComponent';
import type { LoginBody } from '../models/LoginBody';
import type { LoginResponse } from '../models/LoginResponse';
import type { ProteinEditSuccess } from '../models/ProteinEditSuccess';
import type { ProteinEntry } from '../models/ProteinEntry';
import type { RangeFilter } from '../models/RangeFilter';
import type { SearchProteinsBody } from '../models/SearchProteinsBody';
import type { SearchProteinsResults } from '../models/SearchProteinsResults';
import type { SimilarProtein } from '../models/SimilarProtein';
import type { UploadArticleImageComponent } from '../models/UploadArticleImageComponent';
import type { UploadArticleProteinComponent } from '../models/UploadArticleProteinComponent';
import type { UploadArticleTextComponent } from '../models/UploadArticleTextComponent';
import type { UploadBody } from '../models/UploadBody';
import type { UploadError } from '../models/UploadError';
import type { UploadPNGBody } from '../models/UploadPNGBody';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * Login
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static login(
        requestBody: LoginBody,
    ): CancelablePromise<(LoginResponse | null)> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/users/login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Search Proteins
     * @param requestBody
     * @returns SearchProteinsResults Successful Response
     * @throws ApiError
     */
    public static searchProteins(
        requestBody: SearchProteinsBody,
    ): CancelablePromise<SearchProteinsResults> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/search/proteins',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Search Range Length
     * @returns RangeFilter Successful Response
     * @throws ApiError
     */
    public static searchRangeLength(): CancelablePromise<RangeFilter> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/search/range/length',
        });
    }
    /**
     * Search Range Mass
     * @returns RangeFilter Successful Response
     * @throws ApiError
     */
    public static searchRangeMass(): CancelablePromise<RangeFilter> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/search/range/mass',
        });
    }
    /**
     * Search Species
     * @returns any Successful Response
     * @throws ApiError
     */
    public static searchSpecies(): CancelablePromise<(Array<string> | null)> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/search/species',
        });
    }
    /**
     * Search Venome Similar
     * @param proteinName
     * @returns SimilarProtein Successful Response
     * @throws ApiError
     */
    public static searchVenomeSimilar(
        proteinName: string,
    ): CancelablePromise<Array<SimilarProtein>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/search/venome/similar/{protein_name}',
            path: {
                'protein_name': proteinName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Search Venome Similar Compare
     * @param proteinName
     * @param proteinCompare
     * @returns SimilarProtein Successful Response
     * @throws ApiError
     */
    public static searchVenomeSimilarCompare(
        proteinName: string,
        proteinCompare: string,
    ): CancelablePromise<SimilarProtein> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/search/venome/similar/{protein_name}/{protein_compare}',
            path: {
                'protein_name': proteinName,
                'protein_compare': proteinCompare,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Plddt Given Protein
     * @param proteinName
     * @returns number Successful Response
     * @throws ApiError
     */
    public static getPLddtGivenProtein(
        proteinName: string,
    ): CancelablePromise<Record<string, Array<number>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/protein/pLDDT/{protein_name}',
            path: {
                'protein_name': proteinName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Pdb File
     * @param proteinName
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getPdbFile(
        proteinName: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/protein/pdb/{protein_name}',
            path: {
                'protein_name': proteinName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Fasta File
     * @param proteinName
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getFastaFile(
        proteinName: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/protein/fasta/{protein_name}',
            path: {
                'protein_name': proteinName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Protein Entry
     * Get a single protein entry by its id
     * Returns: ProteinEntry if found | None if not found
     * @param proteinName
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getProteinEntry(
        proteinName: string,
    ): CancelablePromise<(ProteinEntry | null)> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/protein/entry/{protein_name}',
            path: {
                'protein_name': proteinName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Protein Entry
     * @param proteinName
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteProteinEntry(
        proteinName: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/protein/entry/{protein_name}',
            path: {
                'protein_name': proteinName,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Upload Protein Png
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static uploadProteinPng(
        requestBody: UploadPNGBody,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/protein/upload/png',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Upload Protein Entry
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static uploadProteinEntry(
        requestBody: UploadBody,
    ): CancelablePromise<(UploadError | null)> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/protein/upload',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Edit Protein Entry
     * edit_protein_entry
     * Returns: On successful edit, will return an object with editedName
     * If not successful will through an HTTP status 500
     * @param requestBody
     * @returns ProteinEditSuccess Successful Response
     * @throws ApiError
     */
    public static editProteinEntry(
        requestBody: EditBody,
    ): CancelablePromise<ProteinEditSuccess> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/protein/edit',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Align Proteins
     * @param proteinA
     * @param proteinB
     * @returns string Successful Response
     * @throws ApiError
     */
    public static alignProteins(
        proteinA: string,
        proteinB: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/protein/pdb/{proteinA}/{proteinB}',
            path: {
                'proteinA': proteinA,
                'proteinB': proteinB,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Article
     * get_article
     *
     * Args:
     * title (str): title of the article
     *
     * Raises:
     * HTTPException: status 404 if the article is not found by the given title
     * HTTPException: status 500 if any other errors occur
     *
     * Returns:
     * Article
     * @param title
     * @returns Article Successful Response
     * @throws ApiError
     */
    public static getArticle(
        title: string,
    ): CancelablePromise<Article> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/article/meta/{title}',
            path: {
                'title': title,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Article
     * @param title
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteArticle(
        title: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/article/meta/{title}',
            path: {
                'title': title,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get All Articles Metadata
     * @returns Article Successful Response
     * @throws ApiError
     */
    public static getAllArticlesMetadata(): CancelablePromise<Array<Article>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/article/all/meta',
        });
    }
    /**
     * Upload Article
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static uploadArticle(
        requestBody: ArticleUpload,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/article/meta/upload',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Edit Article
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static editArticle(
        requestBody: EditArticle,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/article/meta',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Article Component
     * @param componentId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteArticleComponent(
        componentId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/article/component/{component_id}',
            path: {
                'component_id': componentId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Edit Article Text Component
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static editArticleTextComponent(
        requestBody: EditArticleTextComponent,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/article/component/text',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Upload Article Text Component
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static uploadArticleTextComponent(
        requestBody: UploadArticleTextComponent,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/article/component/text',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Edit Article Protein Component
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static editArticleProteinComponent(
        requestBody: EditArticleProteinComponent,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/article/component/protein',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Upload Article Protein Component
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static uploadArticleProteinComponent(
        requestBody: UploadArticleProteinComponent,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/article/component/protein',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Edit Article Image Component
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static editArticleImageComponent(
        requestBody: EditArticleImageComponent,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/article/component/image',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Upload Article Image Component
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static uploadArticleImageComponent(
        requestBody: UploadArticleImageComponent,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/article/component/image',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Insert Component Above
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public static insertComponentAbove(
        requestBody: InsertComponent,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/article/component/insert-above',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
