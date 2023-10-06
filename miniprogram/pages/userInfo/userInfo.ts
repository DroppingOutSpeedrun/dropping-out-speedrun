import { loginByFanya, loginByV11 } from "../../services/login";
import {
  Credential,
  GetCookieFailedResult,
  LoginResult,
  NameFailedResult,
  LoginType,
} from "../../utils/types";
import { isString } from "../../utils/util";

// pages/userInfo/userInfo.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {
    id: -1,
    name: '',
    username: '',
    password: '',
    totalOfCourse: 0,
    remeber: false,
    firstTimeRemeber: true,
    hideUserManagements: true,
    errorMessage: null as null | string,
  },
  emptyMethod() {},
  /**
   * Remove user by channel
   */
  removeUser() {
    const { id } = this.data;

    console.debug(`remove user ${id}`);

    this.getOpenerEventChannel().emit('removeUser', id);
    this.getOpenerEventChannel().emit('removeCredential', id);
  },
  /**
   * Add user by channel
   */
  addUser(
    loginType: LoginType,
    result: LoginResult | GetCookieFailedResult | NameFailedResult
  ) {
    if (!result.status) {
      console.error("failed to login user", result);
      this.setData({ errorMessage: JSON.stringify(result.data) });
      return;
    }

    const { user } = result;

    this.getOpenerEventChannel().emit('addUser', user);
    if (this.data.remeber) {
      console.debug(`cache username and password for user ${user.id}`);

      const credential: Credential = {
        id: user.id,
        loginType,
        username: this.data.username,
        password: this.data.password,
      };
      this.getOpenerEventChannel().emit('addCredential', credential);
    } else {
      // maybe user is updating cookie
      this.getOpenerEventChannel().emit('removeCredential', user.id);
    }

    this.setData({ errorMessage: null });
    wx.navigateBack();
  },
  loginFanya() {
    const { username, password } = this.data;
    loginByFanya(username, password).then((result) =>
      this.addUser('fanya', result)
    ).catch((e) => {
      console.error(e);
      this.setData({ errorMessage: JSON.stringify(e) });
    });
  },
  loginV11() {
    const { username, password } = this.data;
    loginByV11(username, password).then((result) =>
      this.addUser('v11', result)
    ).catch((e) => {
      console.error(e);
      this.setData({ errorMessage: JSON.stringify(e) });
    });
  },
  /**
   * Jump to privacyTips if no credential saved
   */
  toPrivacyTips() {
    if (this.data.firstTimeRemeber && this.data.remeber) {
      wx.navigateTo({ url: '../privacyTips/privacyTips' });
    }
  },
  /**
   * Refresh courseInfoArray by channel
   */
  refreshCourseInfoArray() {
    console.debug(`refresh courseInfoArray of user ${this.data.id}`);
    this.getOpenerEventChannel().emit('refreshCourseInfoArray', this.data.id);
    wx.showToast({ title: '已请求刷新', icon: 'none' });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (!isString(options.channelOpened) || !this.getOpenerEventChannel()) {
      wx.navigateBack();
    }

    const rawChannelOpened = options.channelOpened as string;
    try {
      const channelOpened = JSON.parse(rawChannelOpened);

      console.debug(`channelOpened =`, channelOpened);
      if (!channelOpened) {
        wx.navigateBack();
      }
    } catch (e) {
      if (e instanceof TypeError) {
        console.warn('failed to parse channelOpened from opener');
        wx.navigateBack();
      } else {
        wx.navigateBack();
        throw e;
      }
    }

    if (options.id) {
      try {
        const id = JSON.parse(options.id);

        console.debug(`id =`, id);

        const totalsOfCourse = getApp().globalData.totalsOfCourse;
        console.debug(`totalsOfCourse =`, totalsOfCourse);
        let totalOfCourse = totalsOfCourse[id];

        if (typeof totalOfCourse !== 'number' || Number.isNaN(totalOfCourse)) {
          console.warn('failed to read totalsOfCourse from globalData');
          totalOfCourse = 0;
        }

        this.setData({
          id,
          totalOfCourse,
          hideUserManagements: false,
        });
      } catch (e) {
        if (e instanceof TypeError) {
          console.warn('failed to parse id from opener');
          wx.navigateBack();
        } else {
          wx.navigateBack();
          throw e;
        }
      }
    }

    if (options.name) {
      try {
        const name = JSON.parse(options.name);

        this.setData({
          name,
        });
      } catch (e) {
        if (e instanceof TypeError) {
          console.warn('failed to parse name from opener');
          wx.navigateBack();
        } else {
          wx.navigateBack();
          throw e;
        }
      }
    }

    if (options.credential) {
      try {
        const credential: Credential = JSON.parse(options.credential);

        const totalsOfCourse = getApp().globalData.totalsOfCourse;
        console.debug(`totalsOfCourse =`, totalsOfCourse);
        let totalOfCourse = totalsOfCourse[credential.id];

        if (typeof totalOfCourse !== 'number' || Number.isNaN(totalOfCourse)) {
          console.warn('failed to read totalsOfCourse from globalData');
          totalOfCourse = 0;
        }

        this.setData({
          remeber: true,
          id: credential.id,
          username: credential.username,
          password: credential.password,
          totalOfCourse,
          hideUserManagements: false,
        });
      } catch (e) {
        if (e instanceof TypeError) {
          console.warn('failed to parse credential from opener');
          wx.navigateBack();
        } else {
          wx.navigateBack();
          throw e;
        }
      }
    }

    if (options.firstTimeRemeber) {
      try {
        const firstTimeRemeber: boolean = JSON.parse(options.firstTimeRemeber);
        this.setData({ firstTimeRemeber });
      } catch (e) {
        if (e instanceof TypeError) {
          console.warn('failed to parse firstTimeRemeber from opener');
          wx.navigateBack();
        } else {
          wx.navigateBack();
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
