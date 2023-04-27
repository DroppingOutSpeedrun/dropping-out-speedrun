import { login } from "../../services/login";
import { Credential, GetCookieFailedResult, LoginResult, NameFailedResult, User } from "../../utils/types";
import { isString, parametersToStringifyString, toCredential } from "../../utils/util";

// pages/userManager/userManager.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {
    users: [] as User[],
    credentials: [] as Credential[],
    idToCredentials: {} as { [id: number]: Credential },
  },
  /**
   * Convert credentials to Object<id: number, credential: Credential> for wxml
   * @param credentials credentials from storage
   */
  toIdToCredentials(credentials: Credential[]) {
    return credentials.reduce((c, credential) => ({
      ...c,
      [credential.id]: credential,
    }), {});
  },
  /**
   * Open userInfo from wxml
   * @param e id, name and credential from wxml
   */
  openUserInfo(e: WechatMiniprogram.BaseEvent) {
    const { id, name, credential } = e.currentTarget.dataset as {
      [key: string]: string
    };

    let existedParameters = {};
    try {
      existedParameters = JSON.parse(e.target.dataset.parameters);
    } catch (e) {
      if (!(e instanceof SyntaxError)) {
        console.warn(
          'unknown error occurred during parsing parameters for openUserInfo',
          e,
        );
      }
    }

    const parameters = {
      ...existedParameters,
      channelOpened: this.getOpenerEventChannel() !== null,
      firstTimeRemeber: !(this.data.credentials.length > 0),
      ...(credential ? { credential } : {}),
      ...(id ? { id } : {}),
      ...(name ? { name } : {}),
    };

    console.debug('parsed parameters =', parameters);

    wx.navigateTo({
      url: `../userInfo/userInfo?${parametersToStringifyString(parameters)}`,
      events: {
        /**
         * Add user from channel
         * @param user user to be added
         */
        addUser: (user: User) => {
          const filteredUsers = this.data.users.filter((u) => u.id !== user.id);
          const newUsers = filteredUsers.concat(user);

          console.debug('newUsers =', newUsers);

          this.setData({ users: newUsers });
          this.getOpenerEventChannel().emit('addUser', user);
        },
        /**
         * Add credential from channel
         * @param credential credential to be added
         */
        addCredential: (credential: Credential) => {
          const filteredCredentials = this.data.credentials
            .filter((c) => c.id !== credential.id);
          const newCredentials = filteredCredentials.concat(credential);

          this.setData({
            credentials: newCredentials,
            idToCredentials: this.toIdToCredentials(newCredentials),
          });
          wx.setStorage({ key: 'credentials', encrypt: true, data: newCredentials });
        },
        /**
         * Remove user from channel
         * @param id id of user to be removed from caches, users and nameOfUsers
         */
        removeUser: (id: number) => {
          console.debug(`remove user ${id}`);
          
          const users = this.data.users.filter((u) => u.id !== id);
          this.setData({ users });
          this.getOpenerEventChannel().emit('removeUser', id);
        },
        /**
         * Remove credential from channel
         * @param id id of credential to be removed from credentials
         */
        removeCredential: (id: number) => {
          console.debug(`remove credential ${id}`);

          const credentials = this.data.credentials.filter((c) => c.id !== id);
          wx.setStorage({ key: 'credentials', encrypt: true, data: credentials })
            .then(() =>
              this.setData({
                credentials: credentials,
                idToCredentials: this.toIdToCredentials(credentials),
              })
            );
        },
        /**
         * Refresh courseInfoArray by ID from channel
         * @param id ID of user to be refreshed
         */
        refreshCourseInfoArray: (id: number) => this.getOpenerEventChannel()
          .emit('refreshCourseInfoArray', id),
      }
    });
  },

  copyGitHubLink() {
    wx.setClipboardData({
      data: 'https://github.com/DroppingOutSpeedrun/Dropping-Out-Speedrun',
    });
  },

  copyBitbucketLink() {
    wx.setClipboardData({
      data: 'https://bitbucket.org/dropping-out-speedrun/dropping-out-speedrun',
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (!this.getOpenerEventChannel()) {
      console.warn('openerEventChannel not found');
      wx.navigateBack();
    }

    wx.getStorage({ key: 'credentials', encrypt: true }).then((result) => {
      console.debug('get credentials from storage', result);

      const credentials = result.data;
      if (!Array.isArray(credentials)) {
        console.warn('failed to parse credentials from storage', result);
        wx.showToast({ title: '读取账号密码信息时出错', icon: 'error' });
        return;
      }

      try {
        const prasedCredentials = credentials.map((credential) =>
          toCredential(credential)
        );
        this.setData({
          credentials: prasedCredentials,
          idToCredentials: this.toIdToCredentials(prasedCredentials),
        });
      } catch (e) {
        if (e instanceof TypeError) {
          console.warn('failed to parse credentials');
          wx.removeStorage({ key: 'credentials' });
        } else {
          throw e;
        }
      }
    }).catch((e) => {
      if (isString(e.errMsg) && e.errMsg.includes('data not found')) {
        console.debug('credentials is empty yet');
      } else {
        throw e;
      }
    });

    if (options.users) {
      try {
        const users = JSON.parse(options.users);
        console.debug('users from opener', users);
        this.setData({ users });
      } catch (e) {
        if (e instanceof TypeError) {
          console.warn('failed to parse users from opener');
        } else {
          throw e;
        }
      }
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    console.debug('start refreshing cookies');
    let promises: Promise<LoginResult|GetCookieFailedResult|NameFailedResult>[] = [];
    this.data.credentials.forEach(({ username, password }) =>
      promises = promises.concat(login(username, password))
    );

    Promise.allSettled(promises).then((results) => results.forEach((result) => {
      if (result.status !== 'fulfilled') {
        console.error('failed to process this promise', result);
        wx.showToast({
          title: `部分用户的登录信息刷新失败：${result.reason}`,
          icon: 'error',
        });
        return;
      }

      const { status, message, data } = result.value;

      if (!status) {
        console.error(message, data);
        wx.showToast({ title: message, icon: 'error' });
        return;
      }

      const user: User = (result.value as any).user;
      this.getOpenerEventChannel().emit('addUser', user);
    })).finally(() => wx.stopPullDownRefresh());
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
});
