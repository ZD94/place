
import { DB } from '@jingli/database';

export async function getCity(id: string) { 
    if (!id) { 
        return null;
    }
    if (isMatchOldStyle(id)) { 
        let alternate = await DB.models['CityAltName'].findOne({
            where: {
                lang: 'jlcityid',
                value: id,
            }
        });
        if (!alternate) { 
            return null;
        }
        id = alternate.cityId;
    }
    return DB.models['City'].findById(id);
}

export function isMatchOldStyle(id: string) : boolean { 
    return /^CT(W)?_\d+$/.test(id);
}

export function isMatchId(id: string) : boolean{ 
    return isMatchNewStyle(id) || isMatchOldStyle(id);
}

export function isMatchNewStyle(id: string) :boolean{ 
    return /^\d+$/.test(id);
}