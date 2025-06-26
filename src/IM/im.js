import TencentCloudChat from '@tencentcloud/chat';
import LibGenerateTestUserSig from '../utils/lib-generate-test-usersig.min';

export default {
  data() {
    return {
      imChat: null,
      sdkAppId: 1600034165,
      sdkSecretKey:
        'd5e0d1870929a2f52025a0cf19a9281ac133d3b8391877a3dab09bc40a2b2b30',
      SDKIsReady: false,
      groupID: 'av1',
    };
  },
  methods: {
    createChat({ sdkAppId, sdkSecretKey }) {
      this.sdkAppId = sdkAppId;
      this.sdkSecretKey = sdkSecretKey;

      this.imChat = TencentCloudChat.create({ SDKAppID: this.sdkAppId });
      this.imChat.setLogLevel(0);
      this.chatInstallEvent();
      this.addSignalingListener();
    },
    loginChat(userID) {
      return this.imChat.login({
        userID,
        userSig: new LibGenerateTestUserSig(
          this.sdkAppId,
          this.sdkSecretKey,
          604800
        ).genTestUserSig(userID),
      });
    },
    loginOutChat() {
      return this.imChat.logout();
    },
    // 销毁 SDK 实例。SDK 会先 logout，然后断开 WebSocket 长连接，并释放资源。
    destroyChat() {
      this.chatUnInstallEvent();
      this.removeSignalingListener();
      this.imChat.destroy();
    },
    // 发送文字消息
    sendTextMessage({
      remoteUserID,
      conversationType = TencentCloudChat.TYPES.CONV_C2C,
      text,
    }) {
      let messsage = this.imChat.createTextMessage({
        to: remoteUserID,
        conversationType,
        payload: {
          text,
        }, // 内容容器 {text: 'hello'}
      });
      return this.imChat.sendMessage(messsage);
    },
    // 自定义消息
    sendCustomMessage({
      to,
      conversationType = TencentCloudChat.TYPES.CONV_GROUP,
      type,
      description = '',
      extension = '',
    }) {
      let messsage = this.imChat.createCustomMessage({
        to, // 可以是要发送给对方的userid, 也可以是 群聊groupid
        conversationType,
        payload: {
          data: type, // 用于标识该消息是骰子类型消息
          description, // 获取骰子点数
          extension,
        }, // 内容容器
      });
      return this.imChat.sendMessage(messsage);
    },
    // 信令 邀请单聊
    // userID 被邀请方userid
    invite({ userID, data = '', timeout = 30 }) {
      return this.imChat.invite({ userID, data, timeout });
    },
    // 信令 邀请群聊
    inviteGroup({
      groupID = this.groupID,
      inviteeList,
      data = '',
      timeout = 30,
    }) {
      return this.imChat.inviteInGroup({ groupID, inviteeList, data, timeout });
    },
    // 信令 取消邀请
    cancelInvite({ inviteID, data = '' }) {
      return this.imChat.cancel({
        inviteID, // 邀请的用户 ID， 邀请者 invite / inviteGroup 成功后，返回值中的 inviteID
        data,
      });
    },
    // 信令 接受邀请
    acceptInvite({ inviteID, data = '' }) {
      return this.imChat.accept({ inviteID, data });
    },
    // 信令 拒绝邀请
    rejectInvite({ inviteID, data = '' }) {
      return this.imChat.reject({ inviteID, data });
    },
    // 群聊
    // 创建群聊
    createGroupChat(groupID) {
      return this.imChat.createGroup({
        type: TencentCloudChat.TYPES.GRP_AVCHATROOM, // 直播类型 群聊
        name: '智能眼镜',
        groupID,
      });
    },
    // 搜索群组
    searchGroupByID(groupID) {
      return this.imChat.searchGroupByID(groupID);
    },
    // 加入群聊
    joinGroupChat(groupID) {
      return this.imChat.joinGroup({ groupID });
    },
    // 退出群聊
    quitGroupChat(groupID) {
      return this.imChat.quitGroup(groupID);
    },
    // 解散群
    dismissGroupChat(groupID) {
      return this.imChat.dismissGroup(groupID);
    },
    // 监听信令事件
    addSignalingListener() {
      // 收到新的邀请
      this.imChat.addSignalingListener(
        TencentCloudChat.TSignaling.NEW_INVITATION_RECEIVED,
        this.onNewInvitationReceived
      );
      // 被邀请人接受了邀请
      this.imChat.addSignalingListener(
        TencentCloudChat.TSignaling.INVITEE_ACCEPTED,
        this.onInviteeAccepted
      );
      // 被邀请人拒绝了邀请
      this.imChat.addSignalingListener(
        TencentCloudChat.TSignaling.INVITEE_REJECTED,
        this.onInviteeRejected
      );
      // 邀请被发起者取消
      this.imChat.addSignalingListener(
        TencentCloudChat.TSignaling.INVITATION_CANCELLED,
        this.onInvitationCancelled
      );
      // 邀请超时
      this.imChat.addSignalingListener(
        TencentCloudChat.TSignaling.INVITATION_TIMEOUT,
        this.onInvitationTimeout
      );
    },
    // 移除监听信令事件
    removeSignalingListener() {
      // 收到新的邀请
      this.imChat.removeSignalingListener(
        TencentCloudChat.TSignaling.NEW_INVITATION_RECEIVED,
        this.onNewInvitationReceived
      );
      // 被邀请人接受了邀请
      this.imChat.removeSignalingListener(
        TencentCloudChat.TSignaling.INVITEE_ACCEPTED,
        this.onInviteeAccepted
      );
      // 被邀请人拒绝了邀请
      this.imChat.removeSignalingListener(
        TencentCloudChat.TSignaling.INVITEE_REJECTED,
        this.onInviteeRejected
      );
      // 邀请被发起者取消
      this.imChat.removeSignalingListener(
        TencentCloudChat.TSignaling.INVITATION_CANCELLED,
        this.onInvitationCancelled
      );
      // 邀请超时
      this.imChat.removeSignalingListener(
        TencentCloudChat.TSignaling.INVITATION_TIMEOUT,
        this.onInvitationTimeout
      );
    },
    onNewInvitationReceived(event) {
      console.log('onNewInvitationReceived-收到邀请--', event);
      this.$store.dispatch('setTisgnalingEvent', event);
    },
    onInviteeAccepted(event) {
      console.log('onInviteeAccepted--被邀请人接受邀请-', event);
      this.$store.dispatch('setTisgnalingEvent', event);
    },
    onInviteeRejected(event) {
      console.log('onInviteeRejected---被邀请人拒绝了邀请--', event);
      this.$message.warning('对方未接听！');
      this.$store.dispatch('setTisgnalingEvent', event);
    },
    onInvitationCancelled(event) {
      console.log('onInvitationCancelled---邀请被发起者取消--', event);
      this.$message.warning('对方取消通话！');
      this.$store.dispatch('setTisgnalingEvent', event);
    },
    onInvitationTimeout(event) {
      console.log('onInvitationTimeout---邀请超时--', event);
      this.$message.warning('对方无响应！');
      this.$store.dispatch('setTisgnalingEvent', event);
    },
    chatInstallEvent() {
      // SDK ready
      this.imChat.on(TencentCloudChat.EVENT.SDK_READY, this.onSdkReady);
      this.imChat.on(TencentCloudChat.EVENT.SDK_NOT_READY, this.onSdkNotReady);
      // SDK 不支持多实例登录，即如果此已在其他页面登录，若继续在当前页面登录成功，则会触发 EVENT.KICKED_OUT
      this.imChat.on(TencentCloudChat.EVENT.KICKED_OUT, this.onKickedOut);
      // 接收消息
      this.imChat.on(
        TencentCloudChat.EVENT.MESSAGE_RECEIVED,
        this.onMessageReceived
      );
      // 群组事件监听
      this.imChat.on(
        TencentCloudChat.EVENT.GROUP_LIST_UPDATED,
        this.onGroupListUpdated
      );
    },
    chatUnInstallEvent() {
      // SDK ready
      this.imChat.off(TencentCloudChat.EVENT.SDK_READY, this.onSdkReady);
      this.imChat.off(TencentCloudChat.EVENT.SDK_NOT_READY, this.onSdkNotReady);
      // SDK 不支持多实例登录，即如果此已在其他页面登录，若继续在当前页面登录成功，则会触发 EVENT.KICKED_OUT
      this.imChat.off(TencentCloudChat.EVENT.KICKED_OUT, this.onKickedOut);
      // 接收消息
      this.imChat.off(
        TencentCloudChat.EVENT.MESSAGE_RECEIVED,
        this.onMessageReceived
      );
      // 群组事件监听
      this.imChat.off(
        TencentCloudChat.EVENT.GROUP_LIST_UPDATED,
        this.onGroupListUpdated
      );
    },
    onSdkReady(event) {
      console.log('sdk-ready-', event);
      this.SDKIsReady = true;
      this.$store.dispatch('setSDKReady', true);
    },
    onSdkNotReady(event) {
      console.log('sdk-no-ready-', event);
      this.$store.dispatch('setSDKReady', false);
      // 可调用login 使 sdk 进入 ready
    },
    // 在其他页面登录
    onKickedOut(event) {
      console.log('onKickedOut--', event.data.type);
      // TencentCloudChat.TYPES.KICKED_OUT_MULT_ACCOUNT(Web端，同一账号，多页面登录被踢)
      // TencentCloudChat.TYPES.KICKED_OUT_MULT_DEVICE(同一账号，多端登录被踢)
      // TencentCloudChat.TYPES.KICKED_OUT_USERSIG_EXPIRED(签名过期)
      // TencentCloudChat.TYPES.KICKED_OUT_REST_API(REST API kick 接口踢出)
    },
    // 接收消息
    onMessageReceived(event) {
      console.log('onMessageReceived--', event);
    },
    // 群组事件监听  群组管理功能指的是搜索群组、创建群组、加入群组、获取已加入的群组、退出群组和解散群组等
    onGroupListUpdated(event) {
      console.log('onGroupListUpdated--', event);
    },
    // 生成房间号
    createRoomId() {
      return Math.random().toString().slice(2, 11);
    },
  },
};
