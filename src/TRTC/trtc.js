import TRTC from 'trtc-sdk-v5';
import LibGenerateTestUserSig from '../utils/lib-generate-test-usersig.min';

export default {
  data() {
    return {
      trtc: null,
      remoteUsersViews: [],
      isMutedVideo: false,
      isMutedAudio: false,
      camStatus: 'stopped', // stopped, starting, started, stopping
      micStatus: 'stopped',
      roomStatus: 'exited', // exited, exiting, entering, entered
      sdkAppId: 1600034165,
      sdkSecretKey:
        'd5e0d1870929a2f52025a0cf19a9281ac133d3b8391877a3dab09bc40a2b2b30',
      microphoneId: '', // audio device id
      cameraId: '', // video device id
    };
  },
  methods: {
    initTRTC({ sdkAppId, sdkSecretKey }) {
      if (this.trtc) return;
      this.sdkAppId = sdkAppId;
      this.sdkSecretKey = sdkSecretKey;

      this.trtc = TRTC.create();
      console.log('trtc instance created.');
    },
    async enterRoom({ userId, roomId, autoReceiveAudio = true }) {
      this.roomStatus = 'entering';
      this.initTRTC();
      try {
        await this.trtc.enterRoom({
          roomId: roomId,
          sdkAppId: parseInt(this.sdkAppId, 10),
          userId,
          userSig: new LibGenerateTestUserSig(
            this.sdkAppId,
            this.sdkSecretKey,
            604800
          ).genTestUserSig(userId),
          autoReceiveAudio,
        });
        this.roomStatus = 'entered';

        this.installEventHandlers();
        this.startGetAudioLevel();
        // this.reportSuccessEvent('enterRoom');
        console.log(`Enter room [${roomId}] success.`);
      } catch (error) {
        this.roomStatus = 'exited';
        console.error('enterRoom room failed', error);
        throw error;
      }
    },
    async handleStartLocalAudio() {
      this.micStatus = 'starting';
      this.initTRTC();
      try {
        await this.trtc.startLocalAudio({
          mute: true,
          option: {
            microphoneId: this.microphoneId,
          },
        });
        this.isMutedAudio = true;
        this.micStatus = 'started';
        console.log('Local audio started successfully');
      } catch (error) {
        this.micStatus = 'stopped';
        throw error;
      }
    },

    async handleStopLocalAudio() {
      if (this.micStatus !== 'started') {
        console.log('The audio has not been started');
        return;
      }
      this.micStatus = 'stopping';
      this.initTRTC();
      try {
        await this.trtc.stopLocalAudio();
        this.micStatus = 'stopped';
        console.log('Local audio stopped successfully');
      } catch (error) {
        this.micStatus = 'started';
        throw error;
      }
    },
    async handleStartLocalVideo(viewDomId) {
      this.camStatus = 'starting';
      this.initTRTC();
      try {
        await this.trtc.startLocalVideo({
          view: viewDomId,
          option: {
            cameraId: this.cameraId,
            profile: '1080p',
          },
        });
        this.camStatus = 'started';
        this.isMutedVideo = false;
        console.log('Local video started successfully');
      } catch (error) {
        this.camStatus = 'stopped';
        console.log(
          `Local video is failed to started. Error: ${error.message}`
        );
        throw error;
      }
    },

    async handleStopLocalVideo() {
      if (this.camStatus !== 'started') {
        console.log('The video has not been started');
        return;
      }
      this.camStatus = 'stopping';
      this.initTRTC();
      try {
        await this.trtc.stopLocalVideo();
        this.camStatus = 'stopped';
        console.log('Local audio stopped successfully');
      } catch (error) {
        this.camStatus = 'started';
        console.log(
          `Local audio is failed to stopped. Error: ${error.message}`
        );
        throw error;
      }
    },

    async exitRoom() {
      if (this.roomStatus !== 'entered') {
        console.log('The room has not been entered');
        return;
      }
      this.roomStatus = 'exiting';
      this.stopGetAudioLevel();

      try {
        await this.trtc.exitRoom();
        this.roomStatus = 'exited';
        this.remoteUsersViews = [];
        this.uninstallEventHandlers();

        console.log('Exit room success.');
      } catch (error) {
        this.roomStatus = 'entered';
        console.log(`Exit room failed. Error: ${error.message}`);
        throw error;
      }

      if (this.micStatus === 'started') this.handleStopLocalAudio();
      if (this.camStatus === 'started') this.handleStopLocalVideo();
      if (this.shareStatus === 'shared') this.handleStopScreenShare();
    },
    async muteVideo() {
      try {
        await this.trtc.updateLocalVideo({ mute: true });
        this.isMutedVideo = true;
        console.log('Mute video success.');
      } catch (error) {
        console.log(`Mute video error: ${error.message}`);
      }
    },

    async muteAudio() {
      try {
        await this.trtc.updateLocalAudio({ mute: true });
        this.isMutedAudio = true;
        console.log('Mute audio success.');
      } catch (error) {
        console.log(`Mute audio error: ${error.message}`);
      }
    },

    async unmuteVideo() {
      try {
        await this.trtc.updateLocalVideo({ mute: false });
        this.isMutedVideo = false;
        console.log('Unmute video success.');
      } catch (error) {
        console.log(`Unmute video error: ${error.message}`);
      }
    },
    // 静音某个远端用户  * 代表所有用户
    async muteRemoteAudio(remoteUserId = '*', mute) {
      try {
        await this.trtc.muteRemoteAudio(remoteUserId, mute);
        console.log('mute remote audio success.');
      } catch (error) {
        console.log(`mute remote audio error: ${error.message}`);
      }
    },

    async unmuteAudio() {
      try {
        await this.trtc.updateLocalAudio({ mute: false });
        this.isMutedAudio = false;
        console.log('Unmute audio success.');
      } catch (error) {
        console.log(`Unmute audio error: ${error.message}`);
      }
    },
    startGetAudioLevel() {
      this.trtc.on(TRTC.EVENT.AUDIO_VOLUME, (event) => {
        event.result.forEach(({ userId, volume }) => {
          const isMe = userId === '';
          if (isMe) {
            console.log(`my volume: ${volume}`);
          } else {
            console.log(`user: ${userId} volume: ${volume}`);
          }
        });
      });
      this.trtc.enableAudioVolumeEvaluation(2000);
    },

    stopGetAudioLevel() {
      this.trtc && this.trtc.enableAudioVolumeEvaluation(-1);
    },
    installEventHandlers() {
      this.trtc.on(TRTC.EVENT.ERROR, this.handleError);
      this.trtc.on(TRTC.EVENT.KICKED_OUT, this.handleKickedOut);
      this.trtc.on(TRTC.EVENT.REMOTE_USER_ENTER, this.handleRemoteUserEnter);
      this.trtc.on(TRTC.EVENT.REMOTE_USER_EXIT, this.handleRemoteUserExit);
      this.trtc.on(
        TRTC.EVENT.REMOTE_VIDEO_AVAILABLE,
        this.handleRemoteVideoAvailable
      );
      this.trtc.on(
        TRTC.EVENT.REMOTE_VIDEO_UNAVAILABLE,
        this.handleRemoteVideoUnavailable
      );
      this.trtc.on(
        TRTC.EVENT.REMOTE_AUDIO_UNAVAILABLE,
        this.handleRemoteAudioUnavailable
      );
      this.trtc.on(
        TRTC.EVENT.REMOTE_AUDIO_AVAILABLE,
        this.handleRemoteAudioAvailable
      );
      this.trtc.on(
        TRTC.EVENT.SCREEN_SHARE_STOPPED,
        this.handleScreenShareStopped
      );
      this.trtc.on(TRTC.EVENT.CUSTOM_MESSAGE, this.handleCustomMessage);
    },

    uninstallEventHandlers() {
      this.trtc.off(TRTC.EVENT.ERROR, this.handleError);
      this.trtc.off(TRTC.EVENT.KICKED_OUT, this.handleKickedOut);
      this.trtc.off(TRTC.EVENT.REMOTE_USER_ENTER, this.handleRemoteUserEnter);
      this.trtc.off(TRTC.EVENT.REMOTE_USER_EXIT, this.handleRemoteUserExit);
      this.trtc.off(
        TRTC.EVENT.REMOTE_VIDEO_AVAILABLE,
        this.handleRemoteVideoAvailable
      );
      this.trtc.off(
        TRTC.EVENT.REMOTE_VIDEO_UNAVAILABLE,
        this.handleRemoteVideoUnavailable
      );
      this.trtc.off(
        TRTC.EVENT.REMOTE_AUDIO_UNAVAILABLE,
        this.handleRemoteAudioUnavailable
      );
      this.trtc.off(
        TRTC.EVENT.REMOTE_AUDIO_AVAILABLE,
        this.handleRemoteAudioAvailable
      );
      this.trtc.off(
        TRTC.EVENT.SCREEN_SHARE_STOPPED,
        this.handleScreenShareStopped
      );
      this.trtc.off(TRTC.EVENT.CUSTOM_MESSAGE, this.handleCustomMessage);
    },
    handleError(error) {
      console.log(`Local error: ${error.message}`);
      alert(error);
    },

    async handleKickedOut(event) {
      console.log(`User has been kicked out for ${event.reason}`);
      this.trtc = null;
      await this.exitRoom();
    },

    handleRemoteUserEnter(event) {
      const { userId } = event;
      console.log(`Remote User [${userId}] entered`);
    },

    handleRemoteUserExit(event) {
      console.log(`Remote User [${event.userId}] exit`);
    },

    handleRemoteVideoAvailable(event) {
      const { userId, streamType } = event;
      try {
        console.log(`[${userId}] [${streamType}] video available`);
        if (streamType === TRTC.TYPE.STREAM_TYPE_MAIN) {
          this.remoteUsersViews.push(`${userId}_main`);
          this.$nextTick(async () => {
            await this.trtc.startRemoteVideo({
              userId,
              streamType,
              view: `${userId}_main`,
              option: {
                fillMode: 'contain',
              },
            });
          });
        } else {
          this.remoteUsersViews.push(`${userId}_screen`);
          this.$nextTick(async () => {
            await this.trtc.startRemoteVideo({
              userId,
              streamType,
              view: `${userId}_screen`,
              // option: {
              //   fillMode: 'fill',
              // },
            });
          });
        }
        console.log(`Play remote video success: [${userId}]`);
      } catch (error) {
        console.log(
          `Play remote video failed: [${userId}], error: ${error.message}`
        );
      }
    },

    handleRemoteVideoUnavailable(event) {
      console.log(`[${event.userId}] [${event.streamType}] video unavailable`);
      const { streamType } = event;
      this.trtc.stopRemoteVideo({ userId: event.userId, streamType });
      if (streamType === TRTC.TYPE.STREAM_TYPE_MAIN) {
        this.remoteUsersViews = this.remoteUsersViews.filter(
          (userId) => userId !== `${event.userId}_main`
        );
      } else {
        this.remoteUsersViews = this.remoteUsersViews.filter(
          (userId) => userId !== `${event.userId}_screen`
        );
      }
    },

    handleRemoteAudioUnavailable(event) {
      console.log(`[${event.userId}] audio unavailable`);
    },

    handleRemoteAudioAvailable(event) {
      console.log(`[${event.userId}] audio available`);
    },

    handleScreenShareStopped() {
      this.shareStatus = 'stopped';
      console.log('Stop share screen success');
    },
    handleCustomMessage(event) {
      // event.userId: 远端发消息的 userId
      // event.cmdId: 您自定义的消息 Id
      // event.seq: 消息的序号
      // event.data: 消息内容，ArrayBuffer 类型
      console.log(
        `received custom msg from ${
          event.userId
        }, message: ${new TextDecoder().decode(event.data)}`
      );
    },
    async getDevice() {
      let microphoneList = await TRTC.getMicrophoneList();
      let cameraList = await TRTC.getCameraList();
      // let speakerList = await TRTC.getSpeakerList();
      console.log(
        microphoneList,
        cameraList,
        'microphoneList-----cameraList-----'
      );
      if (microphoneList.length > 0)
        this.microphoneId = microphoneList[0].deviceId;
      if (cameraList.length > 0) this.cameraId = cameraList[0].deviceId;
    },
  },
};
