// pages/locationPicker/locationPicker.ts
Page({

  /**
   * 页面的初始数据
   */
  data: {
    longitude: '',
    latitude: '',
    altitude: '',
    random: true,
    address: '',
    markers: [] as { [key: string]: string | number }[],
    coordinateErrorMessage: null as null | string,
    addressErrorMessage: null as null | string,
  },

  emptyMethod() {},

  copyBaiduCoordinatePicker() {
    wx.setClipboardData({
      data: 'https://api.map.baidu.com/lbsapi/getpoint/index.html',
    });
  },

  setMarkers() {
    this.setData({ markers: [{
      id: 0,
      longitude: Number.parseFloat(this.data.longitude) || 113.324520,
      latitude: Number.parseFloat(this.data.latitude) || 23.099994,
      iconPath: '../../images/location_on_FILL1_wght400_GRAD0_opsz48.svg',
      width: 45,
      height: 45,
    }] });
  },

  sign() {
    this.setData({ coordinateErrorMessage: null, addressErrorMessage: null });

    const rawLongitude = this.data.longitude;
    const rawLatitude = this.data.latitude;
    const rawAltitude = this.data.altitude;

    const decimalOfLongitude = rawLongitude.slice(rawLongitude.indexOf('.') + 1);
    const decimalOfLatitude = rawLatitude.slice(rawLatitude.indexOf('.') + 1);

    if (decimalOfLongitude.length > 13 || decimalOfLatitude.length > 13) {
      return this.setData({ errorMessage: '经纬度小数长度不能超过13' });
    }

    const longitude = Number.parseFloat(rawLongitude);
    const latitude = Number.parseFloat(rawLatitude);
    const altitude = Number.parseFloat(rawAltitude);

    if (Number.isNaN(longitude)) {
      return this.setData({ coordinateErrorMessage: '经度应当填写数字' });
    }

    if (Number.isNaN(latitude)) {
      return this.setData({ coordinateErrorMessage: '纬度应当填写数字' });
    }

    if (Number.isNaN(altitude)) {
      return this.setData({ coordinateErrorMessage: '海拔应当填写数字' });
    }

    this.getOpenerEventChannel().emit(
      'sign',
      this.data.random,
      longitude,
      latitude,
      altitude,
      this.data.address,
    );
    wx.navigateBack();
  },

  cancel() {
    this.data.longitude = '-181';
    this.data.latitude = '-91';
    this.data.altitude = '3000001';
    this.data.random = false;
    this.data.address = '';
    this.sign();
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    if (!this.getOpenerEventChannel()) {
      console.warn('openerEventChannel not found');
      wx.navigateBack();
    }

    this.setMarkers();
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
