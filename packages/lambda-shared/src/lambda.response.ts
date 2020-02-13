import { ALBEvent, CloudFrontRequestEvent } from 'aws-lambda';
import { LambdaHttpRequestType } from './lambda';
import { LambdaHttpResponse, LambdaType } from './lambda.response.http';
import { LambdaHttpResponseAlb } from './lambda.response.alb';
import { LambdaHttpResponseCloudFront } from './lambda.response.cf';

export const LambdaHttp = {
    getHeader(type: LambdaType, req: LambdaHttpRequestType, header: string): string | null {
        if (req == null) {
            return null;
        }
        switch (type) {
            case LambdaType.Alb:
                return LambdaHttpResponseAlb.getHeader(req as ALBEvent, header);
            case LambdaType.CloudFront:
                return LambdaHttpResponseCloudFront.getHeader(req as CloudFrontRequestEvent, header);
            default:
                throw new Error('Invalid lambda type');
        }
    },

    create(type: LambdaType, status: number, description: string): LambdaHttpResponse {
        switch (type) {
            case LambdaType.Alb:
                return new LambdaHttpResponseAlb(status, description);
            case LambdaType.CloudFront:
                return new LambdaHttpResponseCloudFront(status, description);
            default:
                throw new Error('Invalid lambda type');
        }
    },
};
