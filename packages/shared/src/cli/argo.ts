/** Is this script running inside of argo */
export function isArgo(): boolean {
  return process.env['ARGO_NODE_ID'] != null;
}
