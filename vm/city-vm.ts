/**
 * Created by wlh on 2017/11/12.
 */


'use strict';

export class CityVmSimple {
    public id: string;
    public name: string;

    constructor(public city) {
        this.id = city.id;
        this.name = city.name;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
        }
    }
}

export class CityVM {

    constructor(public city) {
    }

    toJSON() :any {
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

export class CityWithDistance extends CityVM {
    constructor(public city) {
        super(city);
    }

    toJSON() {
        let obj = super.toJSON();
        obj.distance = this.city.toJSON().distance;
        return obj;
    }
}