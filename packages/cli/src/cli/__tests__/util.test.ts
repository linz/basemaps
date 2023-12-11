import assert from 'node:assert';
import { describe } from 'node:test';

import { nameImageryTitle } from '../util.js';

describe('util', () => {
  o('nameImageryTitle', () => {
    assert.equal(nameImageryTitle('Palmerston-north urban 2016-17 12.125m'), 'palmerston-north_urban_2016-17_12-125m');
    assert.equal(nameImageryTitle('Palmerston-north urban 2016-17 12-125'), 'palmerston-north_urban_2016-17_12-125');
    assert.equal(nameImageryTitle('Palmerston-north / urban 2016-17 12.125'), 'palmerston-north_urban_2016-17_12-125');
    assert.equal(nameImageryTitle('Palmerston.north / urban 2016-17 12.125'), 'palmerston-north_urban_2016-17_12-125');
    assert.equal(nameImageryTitle('Manawatū urban 2016-17 12.125m'), 'manawatu_urban_2016-17_12-125m');
    assert.equal(nameImageryTitle('ĀāĒēĪīŌōŪū urban 2016-17 12.125m'), 'aaeeiioouu_urban_2016-17_12-125m');
    assert.equal(
      nameImageryTitle('Marlborough / Wellington 0.75m SNC50451 (2004-2005)'),
      'marlborough_wellington_0-75m_snc50451_2004-2005',
    );
  });
});
