export const getSearchParam = (key: string, url: string) => {
    if(!url.includes(key)) return null;
    try {
        return url.split(`${key}=`)[1].split('&')[0]
    } catch(e){
        return null;
    }
};
