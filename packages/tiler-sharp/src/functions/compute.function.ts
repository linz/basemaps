export interface ComputeContext {
  data: Buffer;
  width: number;
  height: number;
  channels: 1 | 2 | 3 | 4;
}

export interface ComputeFunction {
  process(ctx: ComputeContext): Promise<ComputeContext> | ComputeContext;
}
