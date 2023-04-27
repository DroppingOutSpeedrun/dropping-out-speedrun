import { getCloudStorageToken, uploadFile } from "../../services/cloudStorage";
import { getActivities, getCourseInfoArray } from "../../services/course";
import {
  generalSign,
  isPhotoSign,
  locationSign,
  photoSign,
  preSign,
  qrCodeSign
} from "../../services/sign";
import {
  ActivitiesResult,
  Activity,
  CloudStorageTokenResult,
  CookieWithCourseInfo,
  CourseInfo,
  IsPhotoSignResult,
  LocationSignResult,
  PhotoSignResult,
  PreSignResult,
  QrCodeSignResult,
  SignMethod,
  SignMethodForChoice,
  SignMethodForHuman,
  SignMethodForHumanChoice,
  SignResult,
  UploadFileResult,
  User
} from "../../utils/types";
import {
  isString, parametersToStringifyString, toCache, userToCookie,
} from "../../utils/util";

Page({
  data: {
    caches: [] as CookieWithCourseInfo[],
    users: [] as User[],
    nameOfUsers: {} as { [id: number]: string },
    missions: {} as {
      [activityId: number]: {
        isPhoto: 'yes' | 'no' | 'unknown',
        courseInfo: CourseInfo,
        activity: Activity,
        users: User[],
      },
    },
    signMethods: {} as { [activityId: number]: string },
    isPhotoCaches: {} as { [id: number]: boolean },
    signMethodsForChoice: null as null | SignMethodForHumanChoice[],
    results: {} as { [activityId: number]: { [userId: number]: string } },
    isChanged: false,
    message: '请先在用户管理中添加用户',
  },
  /**
   * Refresh courseInfoArray in caches
   * @param id ID of user
   * 
   * @returns return true if courseInfoArray was get and set
   */
  refreshCourseInfoArray(id: number) {
    const existedCache = this.data.caches
      .find((cache) => cache.cookie.id === id);

    if (!existedCache) {
      console.warn(
        `refreshCourseInfoArray(): no cached cookie found for user id ${id}`
      );
      return;
    }

    return getCourseInfoArray(existedCache.cookie)
      .then(({ status, data, message, cookie, courseInfoArray }) => {
        if (!status) {
          console.error(message, data);
          wx.showToast({ title: message, icon: 'error' });
          return false;
        }

        // set global variable for userInfo to instantly display changes
        // of number of courses
        getApp().globalData.totalsOfCourse = {
          ...getApp().globalData.totalsOfCourse,
          [cookie.id]: courseInfoArray.length,
        };
        console.debug(
          'new totalsOfCourse from globalData',
          getApp().globalData.totalsOfCourse,
        );

        const caches = this.data.caches.map((cache) => cache.cookie.id === cookie.id
          ? { cookie, courseInfoArray }
          : cache);

        this.setData({ caches, isChanged: true });
        return wx.setStorage({
          key: 'caches',
          data: caches,
        }).then((result) => isString(result.errMsg) && result.errMsg.includes(':ok'));
      });
  },
  /**
   * Add or update user in caches.
   * courseInfoArray will be refreshed if new user added.
   * @param user user to be added
   * 
   * @returns return true if caches, nameOfUsers and users was set
   */
  addUser(user: User) {
    const existedCache = this.data.caches
      .find((cache) => cache.cookie.id === user.id);

    const nameOfUsers = { ...this.data.nameOfUsers, [user.id]: user.name };
    wx.setStorage({
      key: 'nameOfUsers',
      encrypt: true,
      data: nameOfUsers,
    });
    this.setData({
      nameOfUsers,
      isChanged: true,
    });

    if (existedCache) {
      // replace existed cookie
      const caches = this.data.caches.map((cache) => cache.cookie.id === user.id
        ? {
          cookie: existedCache.cookie,
          courseInfoArray: existedCache.courseInfoArray,
        }
        : cache);

      this.setData({
        caches,
        users: this.data.users.map((u) => u.id === user.id ? user : u),
      });

      return wx.setStorage({
        key: 'caches',
        data: caches,
      }).then((result) => isString(result.errMsg) && result.errMsg.includes(':ok'));
    } else {
      // add cookie with empty courseInfoArray
      // we will call refreshCourseInfoArray() later
      const caches = this.data.caches.concat({
        cookie: userToCookie(user),
        courseInfoArray: [],
      });

      this.setData({
        caches,
        users: this.data.users.concat(user),
      });

      return wx.setStorage({
        key: 'caches',
        data: caches,
      }).then(() => this.refreshCourseInfoArray(user.id));
    }
  },
  /**
   * Open userManager from wxml
   * @param e includes `data-parameters` from wxml
   */
  openUserManager(e: WechatMiniprogram.BaseEvent) {
    let existedParameters = {};
    const rawParameters = e.target.dataset.parameters;
    if (isString(rawParameters) && rawParameters.length > 0) {
      try {
        const parsedParameters = JSON.parse(e.target.dataset.parameters);
        if (typeof parsedParameters === 'object' && parsedParameters !== null) {
          existedParameters = parsedParameters;
        } else {
          console.warn(
            'openUserManager(): parameters from index.wxml is not an object.',
          );
        }
      } catch (e) {
        if (e instanceof SyntaxError) {
          console.warn('openUserManager(): failed to parse parameters.', e);
        } else {
          console.error(e);
          wx.showToast({
            title: `打开用户管理时发生未知错误：${JSON.stringify(e)}`,
            icon: 'error',
          });
        }
      }
    }

    const appendedParameters = { users: this.data.users };
    const parameters = { ...existedParameters, ...appendedParameters };

    console.debug('parsed parameters', parameters);

    wx.navigateTo({
      url: `../userManager/userManager?${parametersToStringifyString(parameters)}`,
      events: {
        /**
         * Add user from channel
         * @param user user to be added
         */
        addUser: (user: User) => {
          this.addUser(user);
        },
        /**
         * Remove user from channel
         * @param id id of user to be removed from caches, users and nameOfUsers
         */
        removeUser: (id: number) => {
          const caches = this.data.caches.filter((cache) => cache.cookie.id !== id);
          this.setData({
            caches,
            users: this.data.users.filter((user) => user.id !== id),
          });
          wx.setStorage({
            key: 'caches',
            data: caches,
          });

          let names = {};
          for (const key in this.data.nameOfUsers) {
            // filter nameOfUsers
            if (key !== id.toString()) {
              names = { ...names, [key]: this.data.nameOfUsers[key] };
            }
          }

          this.setData({ names });
          wx.setStorage({ key: 'nameOfUsers', encrypt: true, data: names });
        },
        /**
         * Refresh courseInfoArray by ID from channel
         * @param id ID of user to be refreshed
         */
        refreshCourseInfoArray: (id: number) => this.refreshCourseInfoArray(id),
      },
    });
  },
  /**
   * Set cookie, name of user, course ID, class ID, type of sign method
   * and activity ID for sign
   */
  setMissions() {
    const toSignMethodForHuman = (signMethod: SignMethod): SignMethodForHuman => {
      switch (signMethod) {
        case 'clickOrPhoto':
          return '点击/拍照';
        case 'code':
          return '签到码';
        case 'gesture':
          return '手势';
        case 'location':
          return '位置';
        case 'qrCode':
          return '二维码';
        default:
          return '未知';
      }
    }

    console.debug('adding promises from caches');

    let activitiesPromises: Promise<ActivitiesResult>[] = [];

    // add promise for every course of every user
    this.data.caches.forEach(({ cookie, courseInfoArray }) => courseInfoArray.forEach(
      (courseInfo) => activitiesPromises = activitiesPromises
        .concat(getActivities(cookie, courseInfo))
    ));

    // filter expired activities
    const now = (new Date()).getTime();

    console.debug(
      'filter activities that endTime is before',
      (new Date(now)).toLocaleString(),
    );

    // TODO: add an option that abort requests once a activity found?
    return Promise.allSettled(activitiesPromises).then((activitiesResults) => {
      let ids: number[] = [];
      let isPhotoSignPromises: Promise<IsPhotoSignResult>[] = [];
      let missions: {
        [activityId: number]: {
          isPhoto: 'yes' | 'no' | 'unknown',
          courseInfo: CourseInfo,
          activity: Activity,
          users: User[],
        },
      } = [];
      let signMethods: { [activityId: number]: string } = [];
      let allDone = true;

      activitiesResults.forEach((result) => {
        if (result.status !== 'fulfilled') {
          this.setData({ allDone: false });
          console.error('failed to process this promise', result);
          wx.showToast({ title: result.reason, icon: 'error' });
          return;
        }
  
        const { status, message, data, cookie, activities } = result.value;
        const name = this.data.nameOfUsers[cookie.id];
  
        if (!status || !isString(name) || !(name.length > 0)) {
          this.setData({ allDone: false });
          console.error(message, data);
          console.error(`nameOfUsers[${cookie.id}] = `, name);
          wx.showToast({ title: message, icon: 'error' });
          return;
        }

        activities.filter(
          // filter activities that started before a day
          (activity) => activity.startTime > now - 1000 * 60 * 60 * 24 &&
            // display empty endTime activity
            (activity.endTime < 0 || activity.endTime > now)
        ).filter((activity) => activity.signMethod === 'clickOrPhoto')
          .forEach(({ id }) => {
            if (!ids.includes(id)) {
              console.debug(`activity ${id} is a click or photo sign`);
              ids = ids.concat(id);
              isPhotoSignPromises = isPhotoSignPromises.concat(
                isPhotoSign(id, cookie)
              );
            }
          });
      });

      console.debug('id of clickOrPhoto sign method of activities', ids);

      let isPhotoCaches: { [id: number]: boolean } = {};
      Promise.allSettled(isPhotoSignPromises).then((isPhotoSignResults) =>
        isPhotoSignResults.forEach((isPhotoSignResult) => {
          if (isPhotoSignResult.status !== 'fulfilled') {
            this.setData({ allDone: false });
            console.error(
              'failed to process this isPhotoSignPromise',
              isPhotoSignResult,
            );
            wx.showToast({ title: isPhotoSignResult.reason, icon: 'error' });
            return;
          }

          const { activityId, isPhoto } = isPhotoSignResult.value;
          isPhotoCaches = { ...isPhotoCaches, [activityId]: isPhoto };
        })
      ).then(() => activitiesResults.forEach((activityResult) => {
        if (activityResult.status !== 'fulfilled') {
          allDone = false;
          return;
        }
  
        const { status, cookie, courseInfo, activities } = activityResult.value;
        const name = this.data.nameOfUsers[cookie.id];
  
        if (!status || !isString(name) || !(name.length > 0)) {
          allDone = false;
          return;
        }
  
        const user = { ...cookie, name };
        // latest activity show at top
        activities.concat().sort((a, b) => b.startTime - a.startTime)
          .filter(
            // filter activities that started before a day
            (activity) => activity.startTime > now - 1000 * 60 * 60 * 24 &&
              // display empty endTime activity
              (activity.endTime < 0 || activity.endTime > now)
          ).forEach((activity) => {
            const mission = missions[activity.id];

            if (activity.signMethod === 'clickOrPhoto') {
              const isPhotoCache = isPhotoCaches[activity.id];

              if (typeof isPhotoCache === 'boolean') {
                console.debug('found the cache of isPhoto', isPhotoCache);

                missions = {
                  ...missions,
                  [activity.id]: {
                    isPhoto: isPhotoCache ? 'yes' : 'no',
                    courseInfo,
                    activity,
                    users: mission && Array.isArray(mission.users)
                      ? mission.users.concat(user)
                      : [user],
                  },
                };
                signMethods = {
                  ...signMethods,
                  [activity.id]: isPhotoCache ? '拍照' : '点击',
                };
              } else {
                console.warn(`isPhoto of activity ${activity.id} is unknown`);

                missions = {
                  ...missions,
                  [activity.id]: {
                    isPhoto: 'unknown',
                    courseInfo,
                    activity,
                    users: mission && Array.isArray(mission.users)
                      ? mission.users.concat(user)
                      : [user],
                  },
                };
                signMethods = {
                  ...signMethods,
                  [activity.id]: toSignMethodForHuman(activity.signMethod),
                };
              }
            } else {
              missions = {
                ...missions,
                [activity.id]: {
                  isPhoto: 'no',
                  courseInfo,
                  activity,
                  users: mission && Array.isArray(mission.users)
                    ? mission.users.concat(user)
                    : [user],
                },
              },
              signMethods = {
                ...signMethods,
                [activity.id]: toSignMethodForHuman(activity.signMethod),
              };
            }
          });
      })).then(() => {
        this.setData({ missions, signMethods, isChanged: false });

        if (this.data.users.length > 0) {
          if (activitiesPromises.length > 0) {
            // some missions failed
            if (!allDone) {
              this.setData({
                message: '部分数据获取失败，请尝试在用户管理中更新登录状态并返回主页下拉刷新数据',
              });
              return;
            }
            
            this.setData({
              message: Object.keys(this.data.missions).length > 0
                ? ''
                : '没有签到活动，下拉刷新一下？或是在用户管理中点击用户，查看课程数量是否正常？',
            });
          } else {
            this.setData({ message: '课程列表为空，请在用户管理中尝试更新课程列表' });
          }
        }
      });
    });
  },
  /**
   * Do Promise.sllSettled() for sign services
   * @param activityId ID of activity to be signed
   * @param promises Promises that returned `SignResult`
   */
  doSignPromises(activityId: number, promises: Promise<SignResult>[]) {
    return Promise.allSettled(promises)
      .then((results) => results.forEach((result) => {
        if (result.status !== 'fulfilled') {
          console.error('failed to process this promise', result);
          wx.showToast({ title: result.reason, icon: 'error' });
          return;
        }

        const { status, message, data, user } = result.value;

        if (!status) {
          console.warn(message, data);
        }

        this.setData({
          results: {
            ...this.data.results,
            [activityId]: {
              ...this.data.results[activityId],
              [user.id]: `签到${status ? '成功' : '失败'}：${data}`,
            },
          },
        });
      }
    ));
  },
  /**
   * Sign by QR code
   * @param activityId ID of activity to be signed
   */
  qrCodeSign(activityId: number) {
    let promises: Promise<QrCodeSignResult>[] = [];

    wx.scanCode({}).then(({ result }) => {
      console.debug('QR code scan result', result);

      const encString = 'enc=';
      const start = result.indexOf(encString);
      const end = result.indexOf('&', start);
      if (start < 0 || end <= 0) {
        console.error('failed to parse enc from QR code');
        wx.showToast({ title: '二维码解析失败，请重新扫码', icon: 'error' });
        return;
      }

      const enc = result.slice(start + encString.length, end);

      const { users } = this.data.missions[activityId];

      if (!Array.isArray(users)) {
        console.error(
          `failed to get users in missions[${activityId}]`,
          this.data.missions[activityId],
        );
        wx.showToast({ title: '读取用户信息时出错', icon: 'error' });
        return;
      }

      users.forEach((user) =>
        promises = promises.concat(qrCodeSign(user, activityId, enc))
      );
    }).catch((e) => {
      if (isString(e.errMsg) && e.errMsg.includes('fail cancel')) {
        console.debug('user cancel the code scan');
      } else {
        throw e;
      }
    }).then(() => this.doSignPromises(activityId, promises));
  },
  /**
   * Sign by photo
   * @param activityId ID of activity to be signed
   */
  photoSign(activityId: number) {
    const { users } = this.data.missions[activityId];

    if (!Array.isArray(users)) {
      console.error(
        `failed to get users in missions[${activityId}]`,
        this.data.missions[activityId],
      );
      wx.showToast({ title: '读取用户信息时出错', icon: 'error' });
      return;
    }

    wx.chooseMedia({
      count: users.length > 20 ? 20 : users.length,
      sizeType: ['compressed'],
      mediaType: ['image'],
      success: ({ tempFiles }) => {
        console.debug('tempFiles', tempFiles);

        if (tempFiles.length < users.length) {
          console.info(
            'files not enough, file for some sign will be selected randomly',
          );
        }

        let tokenPromises: Promise<CloudStorageTokenResult>[] = [];

        users.forEach((user) =>
          tokenPromises = tokenPromises.concat(getCloudStorageToken(user))
        );

        let uploadFilePromises: Promise<UploadFileResult>[] = [];
        let photoSignPromises: Promise<PhotoSignResult>[] = [];
        Promise.allSettled(tokenPromises).then((results) => results
          .forEach((result, index) => {
            if (result.status !== 'fulfilled') {
              console.error('failed to process this promise', result);
              wx.showToast({ title: result.reason, icon: 'error' });
              return;
            }

            const { status, message, data, cookie, token } = result.value;

            if (!status) {
              console.error(message, data);
              wx.showToast({ title: message, icon: 'error' });
              return;
            }

            const file = index + 1 > tempFiles.length
              // user does not select enough files for users
              // pick a random file
              ? tempFiles[Math.floor(Math.random() * tempFiles.length)]
              : tempFiles[index];
            console.debug(`file for ${cookie.id}`, file);

            uploadFilePromises = uploadFilePromises.concat(
              uploadFile(cookie, token, file.tempFilePath)
            );
          })
        ).then(() => Promise.allSettled(uploadFilePromises)
          .then((results) => results.forEach((result) => {
            if (result.status !== 'fulfilled') {
              console.error('failed to process this promise', result);
              wx.showToast({ title: result.reason, icon: 'error' });
              return;
            }

            const { status, message, data, cookie, fileId } = result.value;
            const name = this.data.nameOfUsers[cookie.id];

            if (!status || !isString(name) || !(name.length > 0)) {
              console.error(message, data);
              console.error(`nameOfUsers[${cookie.id}] = `, name);
              wx.showToast({ title: message, icon: 'error' });
              return;
            }

            console.debug('fileId', fileId);
            photoSignPromises = photoSignPromises.concat(photoSign(
              { ...cookie, name },
              activityId,
              fileId,
            ));
          }))
        ).then(() => this.doSignPromises(activityId, photoSignPromises));
      },
      fail: (e) => {
        if (isString(e.errMsg) && e.errMsg.includes('fail cancel')) {
          console.debug('user cancel the media choosen');
        } else {
          throw e;
        }
      }
    });
  },
  /**
   * Sign by coordinate
   * @param activityId ID of activity to be signed
   */
  locationSign(
    random: boolean,
    longitude: number,
    latitude: number,
    address: string,
    activityId: number,
  ) {
    const toRandom = () => Math.floor(Math.random() * 2) > 0
      ? Math.floor(Math.random() * 1000000000) / 10000000000000
      : - (Math.floor(Math.random() * 1000000000) / 10000000000000);

    const { users } = this.data.missions[activityId];
  
    if (!Array.isArray(users)) {
      console.error(
        `failed to get users in missions[${activityId}]`,
        this.data.missions[activityId],
      );
      wx.showToast({ title: '读取用户信息时出错', icon: 'error' });
      return;
    }

    let promises: Promise<LocationSignResult>[] = [];

    console.debug('location', { longitude, latitude });
    users.forEach((user) => {
      let parsedLongitude = longitude + (random ? toRandom() : 0);
      let parsedLatitude = latitude + (random ? toRandom() : 0);

      if (random) {
        parsedLongitude += toRandom();
        parsedLatitude += toRandom();
        console.debug(
          `random location for user ${user.id}`,
          { longitude: parsedLongitude, latitude: parsedLatitude },
        );
      }

      promises = promises.concat(locationSign(
        user,
        activityId,
        parsedLongitude,
        parsedLatitude,
        address,
      ));
    });

    this.doSignPromises(activityId, promises);
  },
  /**
   * Sign by click
   * @param activityId ID of activity to be signed
   */
  generalSign(activityId: number) {
    const { users } = this.data.missions[activityId];
  
    if (!Array.isArray(users)) {
      console.error(
        `failed to get users in missions[${activityId}]`,
        this.data.missions[activityId],
      );
      wx.showToast({ title: '读取用户信息时出错', icon: 'error' });
      return;
    }

    const promises: Promise<SignResult>[] = [];

    users.forEach((user) => promises.push(generalSign(user, activityId)));

    this.doSignPromises(activityId, promises);
  },
  /**
   * Call sign function by its `signMethod`
   * @param e includes `data-id` from wxml
   */
  sign(e: WechatMiniprogram.BaseEvent) {
    const toSignMethodForChoice = (
      signMethodForHumanChoice: SignMethodForHumanChoice
    ): SignMethodForChoice => {
      switch (signMethodForHumanChoice) {
        case '点击':
          return 'click';
        case '拍照':
          return 'photo';
        case '签到码':
          return 'code';
        case '手势':
          return 'gesture';
        case '位置':
          return 'location';
        case '二维码':
          return 'qrCode';
        default:
          return 'unknown';
      }
    };

    const activityId = Number.parseInt(e.currentTarget.dataset.id, 10);
    const signMethodFromChoice = toSignMethodForChoice(
      e.currentTarget.dataset.signMethod
    );

    if (Number.isNaN(activityId)) {
      console.error('activityId is not a number', e.currentTarget.dataset.id);
      wx.showToast({ title: '签到活动ID解析异常', icon: 'error' });
      return;
    }

    const mission = this.data.missions[activityId];

    if (typeof mission !== 'object' || mission === null) {
      console.error(`this.data.missions[${activityId}] is not a object`, mission);
      return;
    }

    const { users } = mission;
  
    if (!Array.isArray(users)) {
      console.error(
        `failed to get users in missions[${activityId}]`,
        this.data.missions[activityId],
      );
      wx.showToast({ title: '读取用户信息时出错', icon: 'error' });
      return;
    }

    let promises: Promise<PreSignResult>[] = [];
    // recall after user select sign method manually
    if (signMethodFromChoice === 'unknown') {
      console.debug('pre-signing activity for users');
      users.forEach((user) => promises = promises.concat(preSign(
        user,
        mission.activity.id,
        mission.courseInfo.course.id,
        mission.courseInfo.class.id,
      )));
    }

    Promise.allSettled(promises).then((results) => results.forEach((result) => {
      if (result.status !== 'fulfilled') {
        console.error('failed to process this promise', result);
        wx.showToast({ title: result.reason, icon: 'error' });
        return;
      }

      const { status, message, data, cookie } = result.value;
      if (!status) {
        console.warn(message, data);
        wx.showToast({ title: message, icon: 'error' });
        return;
      }

      this.setData({
        results: {
          ...this.data.results,
          [activityId]: {
            ...this.data.results[activityId],
            [cookie.id]: `预签到${status ? '成功' : '失败'}`,
          },
        },
      });
    })).then(() => {
      const signMethod = signMethodFromChoice === 'unknown'
        ? mission.activity.signMethod
        : signMethodFromChoice;

      switch (signMethod) {
        case 'code':
        case 'gesture':
        case 'click':
          this.generalSign(activityId);
          break;
        case 'photo':
          this.photoSign(activityId);
          break;
        case 'clickOrPhoto':
          switch (mission.isPhoto) {
            case 'yes':
              this.photoSign(activityId);
              break;
            case 'no':
              this.generalSign(activityId);
              break;
            case 'unknown':
              console.warn(`unknown signMethod for activity ${activityId}`, mission);
              this.setData({ signMethodsForChoice: ['点击', '拍照'] });
              break;
          }
          break;
        case 'qrCode':
          this.qrCodeSign(activityId);
          break;
        case 'location':
          wx.navigateTo({
            url: '../locationPicker/locationPicker',
            events: {
              /**
               * Sign by location from channel
               * @param random add random number for longitude and latitude if true
               * @param longitude longitude for sign
               * @param latitude latitude for sign
               * @param address address that will be shown in sign page
               */
              sign: (
                random: boolean,
                longitude: number,
                latitude: number,
                address: string,
              ) => this.locationSign(
                random,
                longitude,
                latitude,
                address,
                activityId
              ),
            },
          });
          break;
        case 'unknown':
          console.warn(`unknown signMethod for activity ${activityId}`, mission);
          this.setData({
            signMethodsForChoice: ['二维码', '位置', '手势', '签到码', '点击', '拍照'],
          });
          break;
      }
    });
  },
  /**
   * Validate and set variables from storage
   */
  onLoad() {
    console.debug('initialize users and courses');

    wx.getStorage({ key: 'nameOfUsers', encrypt: true }).then((result) => {
      console.debug('get nameOfUsers from storage', result);

      try {
        const names = result.data;

        for (const rawId in names) {
          const id = Number.parseInt(rawId, 10);
          if (Number.isNaN(id) || !isString(names[id])) {
            throw TypeError(
              'nameOfUsers is not a valid object with number key and string value',
            );
          }
        }

        this.setData({ nameOfUsers: names });
      } catch (e) {
        if (e instanceof TypeError) {
          console.warn('failed to parse nameOfUsers');
          wx.removeStorage({ key: 'nameOfUsers' });
          wx.removeStorage({ key: 'caches' });
        } else {
          throw e;
        }
      }
    }).catch((e) => {
      if (isString(e.errMsg) && e.errMsg.includes('data not found')) {
        console.debug('nameOfUsers is empty yet');
        return;
      } else {
        throw e;
      }
    }).then(() => wx.getStorage({ key: 'caches' }).then((result) => {
      console.debug('get caches from storage', result);

      const rawCaches = result.data;
      if (Array.isArray(rawCaches)) {
        rawCaches.forEach((rawCache) => {
          try {
            const cache = toCache(rawCache);
            const { cookie } = cache;
            const name = this.data.nameOfUsers[cookie.id];

            if (!isString(name)) {
              throw TypeError(`name of user ${cookie.id} is not found`);
            }

            this.setData({
              users: this.data.users.concat({ ...cookie, name }),
              caches: this.data.caches.concat(cache),
            });

            getApp().globalData.totalsOfCourse = {
              ...getApp().globalData.totalsOfCourse,
              [cookie.id]: cache.courseInfoArray.length,
            };
          } catch (e) {
            if (e instanceof TypeError) {
              console.warn(
                'failed to parse cache, maybe stale data from old version',
              );
              wx.removeStorage({ key: 'nameOfUsers' });
              wx.removeStorage({ key: 'caches' });
            } else {
              console.warn('unknown error occurred during parsing cache', e);
            }
          }
        });

        console.debug(
          'totalsOfCourse from globalData',
          getApp().globalData.totalsOfCourse,
        );
      } else {
        console.warn('failed to parse caches, maybe stale data from old version');
        wx.removeStorage({ key: 'caches' });
      }
    }).catch((e) => {
      if (isString(e.errMsg) && e.errMsg.includes('data not found')) {
        console.debug('caches is empty yet. do initialization.');
        wx.setStorage({ key: 'caches', data: [] });
        return;
      } else {
        throw e;
      }
    })).then(() => {
      const { nameOfUsers, caches } = this.data;

      if (Object.keys(nameOfUsers).length > 0 && caches.length > 0) {
        wx.startPullDownRefresh();
      }
    });
  },
  onPullDownRefresh() {
    console.debug('start resetting missions');
    this.setMissions().finally(() => wx.stopPullDownRefresh());
  },
  onShow() {
    console.debug('data.isChanged', this.data.isChanged);
    if (this.data.isChanged) {
      wx.startPullDownRefresh();
    }
  },
});
