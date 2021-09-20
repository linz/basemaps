/**
 * Base interface for all dynamo records
 *
 * all records should have these values.
 */
export interface BaseConfig {
  /** Primary key of the table */
  id: string;

  /** name of the configuration */
  name: string;

  /** Date that the key was created */
  createdAt: number;

  /** Date the record was last modified */
  updatedAt: number;
}
