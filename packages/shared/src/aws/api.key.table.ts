import * as AWS from 'aws-sdk';
import { BaseDynamoTable } from './aws.dynamo.table';
import { Const } from '../const';

/**
 * The database format for the ApiKey Table
 */
export interface ApiKeyTableRecord extends BaseDynamoTable {
    /** Enable / disable a API Key */
    enabled: boolean;

    /** Timestamp for when this limit expires */
    minuteExpireAt: number;
    /** Number of api requests this minute */
    minuteCount: number;
    /** Allow custom limits set per API Key */
    minuteLimit?: number;

    /** Lock this API Key to a referrer host */
    lockToReferrer?: string;
    /** Lock this API Key to a list of ips */
    lockToIp?: string[];
}

export class ApiKeyTable {
    dynamo: AWS.DynamoDB;

    constructor() {
        this.dynamo = new AWS.DynamoDB({});
    }

    /**
     * Fetch a ApiKey Record from the database
     * @param apiKey The API Key to fetch
     */
    async get(apiKey: string): Promise<ApiKeyTableRecord | null> {
        const res = await this.dynamo
            .getItem({
                TableName: Const.ApiKey.TableName,
                Key: { id: { S: apiKey } },
                ConsistentRead: false,
            })
            .promise();

        if (res.Item == null) {
            return null;
        }

        return AWS.DynamoDB.Converter.unmarshall(res.Item) as ApiKeyTableRecord;
    }
}
