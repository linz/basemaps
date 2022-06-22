import { LogType } from '@basemaps/shared';
import c from 'ansi-colors';
import diff from 'deep-diff';

export const IgnoredProperties = ['id', 'createdAt', 'updatedAt', 'year', 'resolution'];

export class ConfigDiff {
  static printDiff<T>(changes: diff.Diff<T, T>[]): string {
    let output = '';
    let isArray = false;
    for (const change of changes) {
      if (change.kind === 'A') {
        if (change.path) output += change.path.join();
        output += this.printDiff([change.item]);
        isArray = true; // Stop displaying the array changes for each line.
      } else {
        if (isArray) continue;
        if (change.kind === 'E') {
          if (change.path) output += change.path.join();
          output += c.green('\t+' + JSON.stringify(change.rhs));
          output += c.red('\t-' + JSON.stringify(change.lhs)) + '\n';
        } else if (change.kind === 'N') {
          if (change.path) output += change.path.join();
          output += c.green('\t+' + JSON.stringify(change.rhs)) + '\n';
        } else if (change.kind === 'D') {
          if (change.path) output += change.path.join();
          output += c.red('\t-' + JSON.stringify(change.lhs)) + '\n';
        }
      }
    }
    return output;
  }

  static showDiff<T extends { id: string }>(type: string, oldData: T, newData: T, logger: LogType): boolean {
    const changes = diff.diff(oldData, newData, (_path: string[], key: string) => IgnoredProperties.indexOf(key) >= 0);
    if (changes) {
      logger.info({ type, record: newData.id }, 'Changes');
      ConfigDiff.printDiff(changes);
      return true;
    }
    return false;
  }
}
