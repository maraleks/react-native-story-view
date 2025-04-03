import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, useWindowDimensions, View } from 'react-native';
import { Audio, Video } from 'expo-av';
import { Colors, Metrics } from '../../theme';
import ProgressiveImage from './ProgressiveImage';
import styles from './styles';
import { StoryViewProps, StroyTypes } from './types';

const StoryView = (props: StoryViewProps) => {
  const [loading, setLoading] = useState(true);
  const [buffering, setBuffering] = useState(true);
  const source = props?.stories?.[props?.progressIndex];
  const videoRef = useRef<Video>(null);
  const videoData = useRef<Audio.VideoStatus>();
  const isCurrentIndex = props?.index === props?.storyIndex;

  useEffect(() => {
    if (isCurrentIndex) {
      videoRef.current?.setPositionAsync(0); // Сброс видео при переключении
    }
  }, [props?.storyIndex, props?.index]);

  const loadVideo = () => {
    if (isCurrentIndex && videoData.current) {
      setLoading(false);
      setBuffering(false);
      props?.onVideoLoaded?.(videoData.current);
    }
  };

  const { height, width } = useWindowDimensions();

  return (
    <View style={[styles.divStory, { height, width }]} ref={props?.viewRef}>
      {source?.type === StroyTypes.Image ? (
        <ProgressiveImage
          viewStyle={props?.imageStyle ?? styles.imgStyle}
          imgSource={{ uri: source.url ?? '' }}
          thumbnailSource={{ uri: source.url ?? '' }}
          onImageLoaded={props.onImageLoaded}
        />
      ) : (
        isCurrentIndex && (
          <>
            <Video
              ref={videoRef}
              resizeMode={Video.RESIZE_MODE_CONTAIN}
              isLooping={false}
              shouldPlay={!props.pause && !loading}
              source={{ uri: source?.url! }} // URL без проксирования
              onPlaybackStatusUpdate={(status) => {
                videoData.current = status;
                if (status.isLoaded) {
                  if (status.didJustFinish) {
                    props?.onVideoEnd?.();
                  }
                  props?.onVideoProgress?.({
                    currentTime: status.positionMillis,
                    playableDuration: status.playableDurationMillis,
                    seekableDuration: status.durationMillis || 0,
                  });
                  if (!status.isBuffering) loadVideo();
                }
                setBuffering(status.isBuffering || false);
              }}
              useNativeControls={false}
              style={styles.contentVideoView}
              {...props?.videoProps}
            />
            {(loading || buffering) && props?.showSourceIndicator && (
              <ActivityIndicator
                animating
                color={Colors.loaderColor}
                size="small"
                style={styles.loaderView}
              />
            )}
          </>
        )
      )}
    </View>
  );
};

export default StoryView;