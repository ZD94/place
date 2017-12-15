import { CityVM } from "./city-vm";


export class AirportVM extends CityVM { 
    constructor(public iataCode: string, city: any) { 
        super(city);
    }

    toJSON() { 
        let vm = super.toJSON();
        vm.iataCode = this.iataCode;
        return vm;
    }
}