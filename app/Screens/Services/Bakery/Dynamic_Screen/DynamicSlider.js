"use client"

import { useState, useEffect } from "react"
import { View, TouchableOpacity, StyleSheet, Dimensions, Image, PanResponder } from "react-native"
import Icon from "react-native-vector-icons/Ionicons"

const { width } = Dimensions.get("window")

const DEFAULT_IMAGES = [
  "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQL_rJs4I8mzfAJsCXkQvbtY-SxpG9lJdbaif980ru4Tp3DsI_-Vgf3QldQoIYrdn3WZHE&usqp=CAU",
  "https://img.freepik.com/premium-psd/pet-food-animal-shop-banner-template_252779-1055.jpg",
  "https://previews.123rf.com/images/liudmilachernetska/liudmilachernetska2211/liudmilachernetska221109327/193960692-advertising-poster-pet-shop-sale-cute-dog-and-discount-offer-on-light-background-banner-design.jpg",
]

export default function DynamicSlider({
  autoPlay,
  Delay=3000,
  isUri = false,
  imagesByProp,
  navigationShow,
  heightPass = 200,
  mainWidth = "100%",
  mode = "cover",
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const images =
    imagesByProp && imagesByProp[0]?.src && imagesByProp[0].src.length > 0 ? imagesByProp[0].src : DEFAULT_IMAGES

  const goToNext = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % images.length)
  }

  const goToPrevious = () => {
    setActiveIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length)
  }

  // Autoplay effect
  useEffect(() => {
    if (autoPlay) {
      const interval = setInterval(() => {
        goToNext()
      }, Delay)

      return () => clearInterval(interval)
    }
  }, [autoPlay, Delay, goToNext]) // Added goToNext to dependencies

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      const { dx } = gestureState
      return Math.abs(dx) > 20
    },
    onPanResponderMove: (_, gestureState) => {
      const { dx } = gestureState
      if (dx > 50) {
        goToPrevious()
      } else if (dx < -50) {
        goToNext()
      }
    },
  })

  return (
    <View style={styles.container}>
      <View style={[styles.imageContainer, { height: heightPass, width: mainWidth }]} {...panResponder.panHandlers}>
        <Image
          source={{ uri: isUri ? String(images[activeIndex]) : images[activeIndex] }}
          style={[styles.image, { resizeMode: mode }]}
        />
        {navigationShow && (
          <View style={styles.navigation}>
            <TouchableOpacity activeOpacity={0.9} onPress={goToPrevious} style={styles.navButton}>
              <Icon name="chevron-back" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.9} onPress={goToNext} style={styles.navButton}>
              <Icon name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 0,
    alignItems: "center",
  },
  imageContainer: {
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  navigation: {
    position: "absolute",
    top: "30%",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navButton: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 30,
    margin: 12,
    padding: 2,
    alignItems: "center",
  },
})

