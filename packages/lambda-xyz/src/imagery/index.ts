import { MosaicGebcoBathy } from './gebco';
import { MosaicSentinel } from './sentinel';
import { MosaicWellingtonUrban2017 } from './regional/wellington';
import { MosaicGisborneRural, MosaicGisborneUrban } from './regional/gisborne';
import { MosaicBayOfPlentyUrban } from './regional/bay.of.plenty';
import { MosaicDunedinUrban2018 } from './regional/dunedin';

export const Mosaics = [
    MosaicGebcoBathy,
    MosaicSentinel,
    MosaicGisborneRural,
    MosaicGisborneUrban,
    MosaicWellingtonUrban2017,
    MosaicDunedinUrban2018,
    MosaicBayOfPlentyUrban,
].sort((a, b) => a.priority - b.priority);
