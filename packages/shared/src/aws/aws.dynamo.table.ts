/**
 * Base interface for all dynamo records
 *
 * all records should have these values.
 */
export interface BaseDynamoTable {
  /**
   * Primary key of the table
   */
  id: string;
  /**
   * Date that the key was created
   */
  createdAt: number;
  /**
   * Date the record was last modified
   */
  updatedAt: number;
}
