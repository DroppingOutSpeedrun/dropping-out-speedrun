import {
  Cookie,
  CourseInfo,
  RawActivityWithKnownOtherId,
  CourseInfoArrayResult,
  ActivitiesResult,
} from '../utils/types';
import {
  isString,
  toActiveListObject,
  toActivity,
  toCookieString,
  toRawActivityWithKnownOtherId,
} from '../utils/util';

export const getCourseInfoArray = (cookie: Cookie): Promise<CourseInfoArrayResult> =>
  new Promise((resolve, reject) =>
    wx.request({
      method: 'POST',
      url: 'https://mooc1-1.chaoxing.com/visit/courselistdata',
      header: {
        Accept: 'text/html, */*; q=0.01',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8;',
        Cookie: toCookieString({ _uid: cookie.id, _d: cookie._d, vc3: cookie.vc3 }),
      },
      data: 'courseType=1&courseFolderId=0&courseFolderSize=0',
      success: ({ data }) => {
        if (!isString(data) || !data.includes('course_')) {
          resolve({
            status: false,
            data,
            message: 'cannot found any course in data',
            cookie,
            courseInfoArray: [],
          });
          return;
        }

        let courseInfoArray: CourseInfo[] = [];

        const courseIdIdentifier = 'course_';
        const idSpliter = '_';
        const courseNameIdentifier = 'title="';
        const classNameIdentifier = '班级：';
        for (let courseIdBegining = 0; ; courseIdBegining++) {
          courseIdBegining = data.indexOf(courseIdIdentifier, courseIdBegining);
          if (courseIdBegining < 0) {
            break;
          }

          const idSpliterIndex = data.indexOf(
            idSpliter,
            courseIdBegining + courseIdIdentifier.length,
          );
          const couseIdEnding = data.indexOf('"', idSpliterIndex + idSpliter.length);

          const courseNameSearchBeginingIndex = data.indexOf(
            'class="course-name',
            couseIdEnding,
          );
          const courseNameBeginingIndex = data.indexOf(
            courseNameIdentifier,
            courseNameSearchBeginingIndex,
          );
          const courseNameEndingIndex = data.indexOf(
            '"',
            courseNameBeginingIndex + courseNameIdentifier.length,
          );

          const rawCourseId = data.slice(
            courseIdBegining + courseIdIdentifier.length,
            idSpliterIndex,
          );
          const rawClassId = data.slice(
            idSpliterIndex + idSpliter.length,
            couseIdEnding,
          );

          const courseId = Number.parseInt(rawCourseId, 10);
          const classId = Number.parseInt(rawClassId, 10);

          const courseName = data.slice(
            courseNameBeginingIndex + courseNameIdentifier.length,
            courseNameEndingIndex,
          );

          const classNameBeginingIndex = data.indexOf(
            classNameIdentifier,
            courseNameEndingIndex,
          );
          const classNameEndingIndex = data.indexOf(
            '</',
            classNameBeginingIndex,
          );
          const className = data.slice(
            classNameBeginingIndex + classNameIdentifier.length,
            classNameEndingIndex,
          );

          if (Number.isNaN(courseId) || Number.isNaN(classId)) {
            break;
          }

          courseInfoArray = courseInfoArray.concat({
            course: { id: courseId, name: courseName },
            class: { id: classId, name: className },
          })
        }

        resolve({
          status: true,
          data,
          message: '',
          cookie,
          courseInfoArray,
        });
      },
      fail: (e) => reject(e),
    }));

export const getActivities = (
  cookie: Cookie,
  courseInfo: CourseInfo,
): Promise<ActivitiesResult> => new Promise((resolve, reject) => wx.request({
  url: `https://mobilelearn.chaoxing.com/v2/apis/active/student/activelist?fid=0&courseId=${courseInfo.course.id}&classId=${courseInfo.class.id}&_=${new Date().getTime()}`,
  header: { Cookie: toCookieString({
    uf: cookie.uf,
    _d: cookie._d,
    UID: cookie.id,
    vc3: cookie.vc3
  }) },
  success: ({ data }) => {
    try {
      resolve({
        status: true,
        data,
        message: '',
        cookie,
        courseInfo,
        activities: toActiveListObject(data).data.activeList
          .reduce((filtered, activity) => {
            try {
              return filtered.concat(toRawActivityWithKnownOtherId(activity));
            } catch (e) {
              // append sign event only
              return filtered;
            }
          }, <RawActivityWithKnownOtherId[]>[])
          .map((rawActivity) => toActivity(rawActivity)),
      });
    } catch (e) {
      resolve({
        status: false,
        data,
        message: e instanceof TypeError
          ? `maybe hit the Chaoxing API limit`
          : `unknown error: ${JSON.stringify(e)}`,
        cookie,
        courseInfo,
        activities: [],
      });
    }
  },
  fail: (e) => reject(e),
}));
