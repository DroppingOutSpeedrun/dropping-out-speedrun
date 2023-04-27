import {
  User, Cookie, RawActivity, RawActivityListObject, Activity, SignMethod,
  RawActivityWithKnownOtherId, Credential, CookieWithCourseInfo, CourseInfo,
} from './types';

export const isString = (text: unknown): text is string =>
  typeof text === 'string' || text instanceof String;

const isCookie = (obj: any): obj is Cookie =>
  typeof obj.expire === 'number' && typeof obj.id === 'number' && isString(obj.uf)
    && isString(obj.vc3) && isString(obj._d) && isString(obj.fid);

const isCourseInfo = (obj: any): obj is CourseInfo =>
  obj.course && typeof obj.course.id === 'number' && isString(obj.course.name)
    && obj.class && typeof obj.class.id === 'number' && isString(obj.class.name);

const isUser = (obj: any): obj is User => isString(obj.name) && isCookie(obj);

const isCredential = (obj: any): obj is Credential => typeof obj.id === 'number'
  && isString(obj.username) && isString(obj.password);

const isRawActivity = (obj: any): obj is RawActivity =>
  typeof obj.status === 'number' && typeof obj.startTime === 'number'
    && isString(obj.nameFour)
    && (typeof obj.endTime === 'number' || obj.endTime === '')
    && typeof obj.id === 'number' && isString(obj.nameOne);

const isRawActivityListObject = (obj: any): obj is RawActivityListObject => {
  if (!(
    typeof obj.data === 'object' && obj.data !== null
      && Array.isArray(obj.data.activeList)
  )) {
    return false;
  }

  for (const active of obj.data.activeList) {
    if (!isRawActivity(active)) {
      console.log('active problem', active);
      return false;
    }
  }

  return true;
}

const toCookie = (obj: any): Cookie => {
  if (!isCookie(obj)) {
    throw TypeError('passed object is not a cookie');
  }

  return obj;
}

export const toCache = (obj: any): CookieWithCourseInfo => {
  if (!Array.isArray(obj.courseInfoArray)) {
    throw TypeError('courseInfoArray in passed object is not a array');
  }

  for (const courseInfo of obj.courseInfoArray) {
    if (!isCourseInfo(courseInfo)) {
      throw TypeError(
        'courseInfo in courseInfoArray of passed object is not a array',
      );
    }
  }

  return { ...obj, cookie: toCookie(obj.cookie) };
}

export const toUser = (obj: any): User => {
  if (!isUser(obj)) {
    throw TypeError('passed object is not a User');
  }

  return obj;
}

export const toCredential = (obj: any): Credential => {
  if (!isCredential(obj)) {
    throw TypeError('passed object is not a Credential');
  }

  return obj;
}

export const toActiveListObject = (obj: any): RawActivityListObject => {
  if (!isRawActivityListObject(obj)) {
    throw TypeError('passed object is not a RawActivityListObject');
  }

  return obj;
}

const isRawActivityWithKnownOtherId = (rawActivity: any):
  rawActivity is RawActivityWithKnownOtherId => isString(rawActivity.otherId)
    && ['0', '2', '3', '4', '5'].includes(rawActivity.otherId)
    && isRawActivity(rawActivity);

export const toRawActivityWithKnownOtherId = (rawActivity: any):
RawActivityWithKnownOtherId => {
  if (!isRawActivityWithKnownOtherId(rawActivity)) {
    throw TypeError('passed rawActivity have no otherId');
  }

  return rawActivity;
}

export const isSignMethod = (text: string): text is SignMethod => [
  'clickOrPhoto', 'qrCode', 'gesture', 'location', 'code',
].includes(text);

export const toActivity = (rawActivity: RawActivityWithKnownOtherId): Activity => {
  let signMethod: SignMethod = 'unknown';
  switch (rawActivity.otherId) {
    case '0':
      signMethod = 'clickOrPhoto';
      break;
    case '2':
      signMethod = 'qrCode';
      break;
    case '3':
      signMethod = 'gesture';
      break;
    case '4':
      signMethod = 'location';
      break;
    case '5':
      signMethod = 'code';
      break;
  }

  return {
    id: rawActivity.id,
    name: rawActivity.nameOne,
    signMethod,
    startTime: rawActivity.startTime,
    endTime: rawActivity.endTime === ''
      // two hour is a reasonable time
      ? (new Date()).getTime() + 1000 * 60 * 60 * 2
      : rawActivity.endTime,
    endTimeForHuman: rawActivity.nameFour,
    raw: rawActivity,
  };
};

export const parseCookiesFromWx = (cookiesFromWx: Array<String>): Cookie => {
  let cookie: Cookie = {
    // I belive that Cookie will expire within 4 years
    expire: (new Date()).getTime() + 1000 * 60 * 60 * 24 * 365 * 4,
    id: -1,
    uf: '',
    vc3: '',
    _d: '',
    fid: '',
  };
  // Do not check expire
  const keys = Object.keys(cookie)
    .filter((key) => key !== 'expire' && key !== 'id') as Array<keyof Cookie>;

  const now = (new Date()).getTime();
  cookiesFromWx.forEach((c) => {
    const pairs = c.split('; ');
    const important = pairs[0];
    const equalIndex = important.indexOf('=');
    const key = important.slice(0, equalIndex);
    const value = important.slice(equalIndex + 1);

    if (key === '_uid') {
      const id = Number.parseInt(value, 10);
      cookie = { ...cookie, id };
    }
    cookie = { ...cookie, [key]: value };
    
    for (const pair of pairs) {
      if (pair.startsWith('Expires=')) {
        const date = pair.slice('Expires='.length);
        const parsedDate = Date.parse(date);
        if (!Number.isNaN(parsedDate)) {
          if (parsedDate < cookie.expire && parsedDate > now) {
            cookie.expire = parsedDate;
          }
        }

        break;
      }
    }
  });

  keys.forEach((key) => {
    const value = cookie[key];

    if (isString(value)) {
      if (!((cookie[key] as string).length > 0)) {
        throw TypeError(`Failed to parse cookie ${key}: ${value} to string`);
      }
    } else if (typeof value === 'number') {
      if (Number.isNaN(value)) {
        throw TypeError(`failed to parse cookie ${key}: ${value} to number`);
      }
    } else {
      throw TypeError(`failed to parse cookie ${key}: ${value}`);
    }
  });
  return cookie;
}

export const userToCookie = (user: User): Cookie => {
  const keys = Object.keys(user) as (keyof User)[];

  return keys.reduce((existedCookie, key) => key !== 'name'
    ? { ...existedCookie, [key]: user[key] }
    : existedCookie, {} as any);
}

export const toCookieString = (cookie: { [key: string]: number | string }): string =>
  Object.entries(cookie).map(([key, value]) => `${key}=${value}; `)
    .concat('SameSite=Strict; ').join('');

export const parametersToString = (
  parameters: { [key: string]: number | string }
): string => Object.entries(parameters)
  .map(([key, value]) => `${key}=${value}`).join('&');

export const parametersToStringifyString = (
  parameters: { [key: string]: any }
): string => Object.entries(parameters)
  .map(([key, value]) => `${key}=${JSON.stringify(value)}`).join('&');

export const cookieForSign = (cookie: Cookie): { [key: string]: any } => ({
  uf: cookie.uf, _d: cookie._d, UID: cookie.id, vc3: cookie.vc3
});
