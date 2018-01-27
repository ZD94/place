/**
 * Created by wlh on 2017/11/12.
 */

'use strict';

export default class AlternameVm {
    constructor (public alternameInstance) {
    }

    toJSON() {
        if (!this.alternameInstance) {
            return null;
        }
        return {
            id: this.alternameInstance.id,
            lang: this.alternameInstance.lang,
            value: this.alternameInstance.value,
            isRecommend: this.alternameInstance.isRecommend,
        }
    }
}