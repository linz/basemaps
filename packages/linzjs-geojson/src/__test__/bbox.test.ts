import o from 'ospec';
import { bboxToPolygon, bboxContains } from '../bbox';

o.spec('bbox', () => {
    o('bboxContains', () => {
        o(bboxContains([4, 4, 6, 6], [4, 4, 5, 5])).equals(true);
        o(bboxContains([4, 4, 6, 6], [4, 4, 6, 6])).equals(true);
        o(bboxContains([4, 4, 6, 6], [4.5, 4.5, 5.5, 5.5])).equals(true);

        o(bboxContains([4, 4, 6, 6], [4.5, 4.5, 5.5, 6.5])).equals(false);
        o(bboxContains([4, 4, 6, 6], [4.5, 4.5, 6.5, 5.5])).equals(false);
        o(bboxContains([4, 4, 6, 6], [4.5, 3.5, 5.5, 5.5])).equals(false);
        o(bboxContains([4, 4, 6, 6], [3.5, 4.5, 5.5, 5.5])).equals(false);
    });

    o('bboxToPolygon', () => {
        o(bboxToPolygon([74, -57, 94, -39])).deepEquals([
            [
                [74, -57],
                [94, -57],
                [94, -39],
                [74, -39],
                [74, -57],
            ],
        ]);
    });
});
