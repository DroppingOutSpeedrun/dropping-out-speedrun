export interface RawActivity {
  id: number;
  status: number;
  startTime: number;
  endTime: number | '';
  nameOne: string;
  nameFour: string;
}

export interface RawActivityWithKnownOtherId extends RawActivity {
  otherId: '0' | '2' | '3' | '4' | '5';
}

export interface RawActivityListObject {
  data: { activeList: RawActivity[] };
}

export type SignMethod = 'qrCode' | 'location' | 'gesture' | 'code' | 'clickOrPhoto'
  | 'unknown';

export type SignMethodForHuman = '二维码' | '位置' | '手势' | '签到码' | '点击/拍照'
  | '未知';

export type SignMethodForChoice = 'qrCode' | 'location' | 'gesture' | 'code'
  | 'click' | 'photo' | 'unknown';

export type SignMethodForHumanChoice = '二维码' | '位置' | '手势' | '签到码'
  | '点击' | '拍照' | '未知';

export interface Activity {
  id: number
  name: string;
  signMethod: SignMethod;
  startTime: number;
  endTime: number;
  endTimeForHuman: string;
  raw: RawActivityWithKnownOtherId;
}

export interface Course {
  id: number;
  name: string;
}

export interface Class extends Course {}

export interface CourseInfo {
  course: Course;
  // TODO: array?
  class: Class;
}

export interface Cookie {
  expire: number;
  id: number;
  uf: string;
  vc3: string;
  _d: string;
  fid: string;
}

export interface User extends Cookie {
  name: string;
}

export interface Credential {
  id: number;
  username: string;
  password: string;
}

export interface CookieWithCourseInfo {
  cookie: Cookie;
  courseInfoArray: CourseInfo[];
}

export interface Result {
  status: boolean;
  message: string;
  data: any;
}

export interface CookieResult extends Result {
  cookie: Cookie;
}

export interface GetCookieSuccessResult extends Result {
  status: true;
  cookie: Cookie;
}

export interface GetCookieFailedResult extends Result {
  status: false;
  cookie: {};
}

export interface NameSuccessResult extends CookieResult {
  status: true;
  name: string;
}

export interface NameFailedResult extends CookieResult {
  status: false;
  name: '';
}

export interface LoginResult extends CookieResult {
  user: User;
}

export interface CourseInfoArrayResult extends CookieResult {
  courseInfoArray: CourseInfo[];
}

export interface ActivitiesResult extends CookieResult {
  courseInfo: CourseInfo;
  activities: Activity[];
}

export interface CookieStringResult extends Result {
  cookieString: string;
}

interface ActivityIdResult extends CookieResult {
  activityId: number;
}

export interface PreSignResult extends ActivityIdResult {
  courseId: number;
  classId: number;
}

export interface IsPhotoSignResult extends ActivityIdResult {
  isPhoto: boolean;
}

export interface SignResult extends ActivityIdResult {
  user: User;
}

export interface QrCodeSignResult extends SignResult {
  enc: string;
}

export interface LocationSignResult extends SignResult {
  longitude: number;
  latitude: number;
  address: string;
}

export interface PhotoSignResult extends SignResult {
  fileId: string;
}

export interface CloudStorageTokenResult extends CookieResult {
  token: string;
}

export interface UploadFileResult extends CookieResult {
  token: string;
  filePath: string;
  fileId: string;
}
