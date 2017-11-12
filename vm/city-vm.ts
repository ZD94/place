/**
 * Created by wlh on 2017/11/12.
 */


'use strict';

export class CityVM {

    constructor(public city) {
    }

    toJSON() {
        return {
            id: this.city.id,
            name: this.city.name,
            letter: this.city.letter,
            timezone: this.city.timezone,
            parentId: this.city.parentId,
            location: {
                lat: this.city.lat,
                lng: this.city.lng,
            },
        }
    }
}