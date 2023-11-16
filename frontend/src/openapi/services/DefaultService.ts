/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProteinEntry } from '../models/ProteinEntry';
import type { UploadBody } from '../models/UploadBody';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class DefaultService {

    /**
     * Get All Entries
     * Gets all protein entries from the database
     * Returns: list[ProteinEntry] if found | None if not found
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getAllEntries(): CancelablePromise<(Array<ProteinEntry> | null)> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/all-entries',
        });
    }

    /**
     * Get Protein Entry
     * Get a single protein entry by its id
     * Returns: ProteinEntry if found | None if not found
     * @param proteinId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static getProteinEntry(
        proteinId: string,
    ): CancelablePromise<(ProteinEntry | null)> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/protein-entry/{protein_id}',
            path: {
                'protein_id': proteinId,
            },
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
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/protein-upload',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }

}
