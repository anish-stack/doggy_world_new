import { View, Text } from 'react-native'
import React from 'react'
import TopHeadPart from '../../layouts/TopHeadPart'
import Layout from '../../layouts/Layout'
import { API_END_POINT_URL_LOCAL } from '../../constant/constant'
import { getUser } from '../../hooks/getUserHook'
import { useToken } from '../../hooks/useToken'

export default function Appointments() {
  const { user, refreshUser, loading } = getUser();
  const { token, isLoggedIn, } = useToken();
  const router = useNavigation();
  return (
    <View>
      <TopHeadPart title='Your Consultation 🐾🐾' icon='info' />
      <Layout isHeaderShow={false}></Layout>

    </View>
  )
}