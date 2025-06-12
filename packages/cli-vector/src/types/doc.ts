/**
 * Interface describing a LayerDoc object as created by the vector-cli 'docs' command. Interpolated by Mustache to generate a Markdown a document.
 */
export interface LayerDoc {
  /**
   * The Shortbread layer's name.
   *
   * @example "addresses"
   * @example "boundaries"
   * @example "contours"
   */
  name: string;

  /**
   * The Shortbread layer's description.
   *
   * @example "addresses"
   * @example "boundaries"
   * @example "contours"
   */
  description?: string;

  /**
   * A flag for whether the layer is natively supported by Shortbread (used exclusively by Mustache).
   *
   * @example "addresses"
   * @example "boundaries"
   * @example "contours"
   */
  isCustom: boolean;

  /**
   * FeaturesDoc object containing information from all features, regardless of `kind` attribute value.
   */
  all: FeaturesDoc;

  /**
   * FeaturesDoc objects deriving information from all features with the same `kind` attribute value.
   */
  kinds?: FeaturesDoc[];
}

export interface FeaturesDoc {
  /**
   * The name for this group of features. Typically, the `kind` attribute value for targeting this group of features.
   *
   * @example "all"
   * @example "motorway"
   * @example "peaks"
   */
  name: string;

  /**
   * The filter expression for targeting this group of features.
   *
   * @example `["all"]`
   * @example `["all", ["==", "kind", "motorway"]]`,
   */
  filter: string;

  /**
   * AttributeDoc objects containing attribute information across this group of features.
   */
  attributes: AttributeDoc[];

  /**
   * A flag for whether this FeaturesDoc object describes any attributes (used exclusively by Mustache).
   */
  hasAttributes: boolean;

  /**
   * A comma-separated list of all geometries across this group of features. Typically, only one geometry.
   *
   * @example "LineString"
   * @example "Point, Polygon"
   */
  geometries: string;

  /**
   * An object describing the min and max zoom levels for which features within this group appear.
   *
   * @example { "min": 12, "max": 15 }
   */
  zoom_levels: {
    min: number;
    max: number;
  };
}

export interface AttributeDoc {
  /**
   * The attribute's name.
   */
  name: string;

  /**
   * A comma-separated list of the attribute's types. Typically, only one type.
   *
   * @example "boolean"
   * @example "number, string"
   */
  types: string;

  /**
   * A comma-separated list of the attribute's values. Sometimes only a snippet of the attribute's values. Sometimes minified.
   *
   * @example "1, 2, 3, 4, 5"
   * @example "cable_car, ski_lift, ski_tow"
   * @example "<code>{empty}</code>, industrial, people"
   * @example "<i>12448 unique values</i>""
   */
  values: string;
}
