export function toBoolean(b: string | boolean | number) :boolean { 
    if (typeof b == 'string') { 
        if (b == 'false') return false;
        if (b == '0') return false;
        return true;
    }
    if (typeof b == 'number') { 
        return Boolean(b);
    }
    if (typeof b == 'boolean') { 
        return b;
    }
    return !!b;
}