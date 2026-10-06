import React, { useMemo, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

const PLAYLISTS = [
  {
    id: 'gym-motivation',
    title: 'Gym Motivation Music',
    subtitle: 'Ritmo para tu entrenamiento',
    tag: 'GYM',
    url: 'https://soundcloud.com/workout_playlists/sets/gym-motivation-music-2024',
  },
  {
    id: 'workout-motivation',
    title: 'Workout Motivation',
    subtitle: 'Energía para cada serie',
    tag: 'FOCUS',
    url: 'https://soundcloud.com/workout_playlists/sets/workout-motivation-2024',
  },
];

const SPOTIFY_SEARCHES = [
  {
    id: 'spotify-gym',
    title: 'Gym Workout',
    subtitle: 'Playlists para entrenar',
    tag: 'GYM',
    query: 'gym workout',
  },
  {
    id: 'spotify-motivation',
    title: 'Workout Motivation',
    subtitle: 'Música para subir la energía',
    tag: 'ENERGÍA',
    query: 'workout motivation',
  },
  {
    id: 'spotify-focus',
    title: 'Focus Training',
    subtitle: 'Ritmo para concentrarte',
    tag: 'FOCUS',
    query: 'workout focus',
  },
];

type MusicService = 'soundcloud' | 'spotify';

export default function MusicScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [service, setService] = useState<MusicService>('soundcloud');
  const [selectedId, setSelectedId] = useState(PLAYLISTS[0].id);
  const [selectedSpotifyId, setSelectedSpotifyId] = useState(SPOTIFY_SEARCHES[0].id);
  const selectedPlaylist = PLAYLISTS.find((playlist) => playlist.id === selectedId) ?? PLAYLISTS[0];
  const selectedSpotifySearch =
    SPOTIFY_SEARCHES.find((playlist) => playlist.id === selectedSpotifyId) ?? SPOTIFY_SEARCHES[0];
  const playerUrl = useMemo(() => {
    const params = new URLSearchParams({
      url: selectedPlaylist.url,
      color: '#39FF14',
      auto_play: 'false',
      hide_related: 'true',
      show_comments: 'false',
      show_user: 'true',
      show_reposts: 'false',
      visual: 'false',
    });
    return `https://w.soundcloud.com/player/?${params.toString()}`;
  }, [selectedPlaylist.url]);

  const openSpotify = async () => {
    const url = `https://open.spotify.com/search/${encodeURIComponent(selectedSpotifySearch.query)}`;
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('[Spotify] No se pudo abrir Spotify:', error);
      Alert.alert('No se pudo abrir Spotify', 'Comprueba tu conexión e inténtalo de nuevo.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={styles.heading}>
        <Text style={[styles.eyebrow, { color: theme.tint }]}>SUBE EL VOLUMEN</Text>
        <Text style={[styles.title, { color: theme.text }]}>Música para entrenar</Text>
        <Text style={[styles.subtitle, { color: theme.subtext }]}>Elige tu plataforma y dale energía a la sesión.</Text>
      </View>

      <View style={[styles.serviceSwitcher, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
        {(['soundcloud', 'spotify'] as const).map((option) => {
          const active = service === option;
          const label = option === 'soundcloud' ? 'SoundCloud' : 'Spotify';
          const color = option === 'spotify' ? '#1DB954' : theme.tint;
          return (
            <TouchableOpacity
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setService(option)}
              style={[styles.serviceButton, { backgroundColor: active ? color : 'transparent' }]}
            >
              <Ionicons
                name={option === 'spotify' ? 'musical-notes' : 'radio-outline'}
                size={17}
                color={active ? '#061006' : theme.subtext}
              />
              <Text style={[styles.serviceButtonText, { color: active ? '#061006' : theme.subtext }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {service === 'soundcloud' ? (
        <>
          <View style={styles.playlistList}>
            {PLAYLISTS.map((playlist) => {
              const active = playlist.id === selectedId;
              return (
                <TouchableOpacity
                  key={playlist.id}
                  onPress={() => setSelectedId(playlist.id)}
                  style={[styles.playlistCard, { backgroundColor: theme.card, borderColor: active ? theme.tint : theme.cardBorder }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Reproducir playlist ${playlist.title}`}
                >
                  <View style={[styles.playIcon, { backgroundColor: `${theme.tint}20` }]}>
                    <Ionicons name={active ? 'musical-notes' : 'musical-notes-outline'} size={20} color={theme.tint} />
                  </View>
                  <View style={styles.playlistText}>
                    <Text style={[styles.playlistTitle, { color: theme.text }]}>{playlist.title}</Text>
                    <Text style={[styles.playlistSubtitle, { color: theme.subtext }]}>{playlist.subtitle}</Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: active ? theme.tint : theme.background }]}>
                    <Text style={[styles.tagText, { color: active ? '#061006' : theme.subtext }]}>{playlist.tag}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={[styles.playerCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.playerHeading}>
              <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                <Text style={[styles.playerEyebrow, { color: theme.tint }]}>SOUNDCLOUD</Text>
                <Text style={[styles.playerTitle, { color: theme.text }]}>{selectedPlaylist.title}</Text>
              </View>
              <Ionicons name="radio-outline" size={23} color={theme.tint} />
            </View>
            <View style={styles.webViewFrame}>
              <WebView
                key={selectedPlaylist.id}
                source={{ uri: playerUrl }}
                style={styles.webView}
                originWhitelist={['https://*']}
                javaScriptEnabled
                domStorageEnabled
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction
                onError={({ nativeEvent }) => console.warn('[SoundCloud] Error al cargar el reproductor:', nativeEvent.description)}
              />
            </View>
            <TouchableOpacity
              style={[styles.openButton, { borderColor: theme.cardBorder }]}
              onPress={() => Linking.openURL(selectedPlaylist.url)}
            >
              <Ionicons name="open-outline" size={16} color={theme.tint} />
              <Text style={[styles.openButtonText, { color: theme.tint }]}>Abrir en SoundCloud</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <View style={styles.playlistList}>
            {SPOTIFY_SEARCHES.map((playlist) => {
              const active = playlist.id === selectedSpotifyId;
              return (
                <TouchableOpacity
                  key={playlist.id}
                  onPress={() => setSelectedSpotifyId(playlist.id)}
                  style={[styles.playlistCard, { backgroundColor: theme.card, borderColor: active ? '#1DB954' : theme.cardBorder }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Buscar ${playlist.title} en Spotify`}
                >
                  <View style={[styles.playIcon, { backgroundColor: '#1DB95220' }]}>
                    <Ionicons name="musical-notes" size={20} color="#1DB954" />
                  </View>
                  <View style={styles.playlistText}>
                    <Text style={[styles.playlistTitle, { color: theme.text }]}>{playlist.title}</Text>
                    <Text style={[styles.playlistSubtitle, { color: theme.subtext }]}>{playlist.subtitle}</Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: active ? '#1DB954' : theme.background }]}>
                    <Text style={[styles.tagText, { color: active ? '#061006' : theme.subtext }]}>{playlist.tag}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={[styles.playerCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={styles.playerHeading}>
              <View style={{ flex: 1, backgroundColor: 'transparent' }}>
                <Text style={[styles.playerEyebrow, { color: '#1DB954' }]}>SPOTIFY</Text>
                <Text style={[styles.playerTitle, { color: theme.text }]}>{selectedSpotifySearch.title}</Text>
              </View>
              <Ionicons name="musical-notes" size={23} color="#1DB954" />
            </View>
            <Text style={[styles.spotifyDescription, { color: theme.subtext }]}>
              Abre Spotify para elegir y reproducir playlists de {selectedSpotifySearch.title.toLowerCase()}.
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={openSpotify}
              style={[styles.spotifyButton, { backgroundColor: '#1DB954' }]}
            >
              <Ionicons name="play" size={17} color="#061006" />
              <Text style={styles.spotifyButtonText}>Buscar y reproducir en Spotify</Text>
              <Ionicons name="open-outline" size={16} color="#061006" />
            </TouchableOpacity>
          </View>
        </>
      )}

      <View style={[styles.noteCard, { borderColor: theme.cardBorder }]}>
        <Ionicons name="information-circle-outline" size={18} color={theme.subtext} />
        <Text style={[styles.noteText, { color: theme.subtext }]}>
          {service === 'soundcloud'
            ? 'La música se reproduce desde SoundCloud. La disponibilidad puede depender de tu conexión y de las condiciones de esa plataforma.'
            : 'Spotify se abre en la aplicación o en la web. La reproducción depende de tu cuenta y de las condiciones de Spotify.'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  heading: { marginBottom: 18, backgroundColor: 'transparent' },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.2, marginBottom: 6 },
  title: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 6 },
  serviceSwitcher: { flexDirection: 'row', borderWidth: 1, borderRadius: 14, padding: 4, marginBottom: 16 },
  serviceButton: { flex: 1, minHeight: 42, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  serviceButtonText: { fontSize: 12, fontWeight: '800' },
  playlistList: { gap: 10, marginBottom: 18, backgroundColor: 'transparent' },
  playlistCard: { minHeight: 72, borderRadius: 15, borderWidth: 1, padding: 11, flexDirection: 'row', alignItems: 'center' },
  playIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  playlistText: { flex: 1, backgroundColor: 'transparent' },
  playlistTitle: { fontSize: 13, fontWeight: '800' },
  playlistSubtitle: { fontSize: 11, marginTop: 4 },
  tag: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, marginLeft: 8 },
  tagText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  playerCard: { borderWidth: 1, borderRadius: 18, padding: 13, overflow: 'hidden' },
  playerHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: 'transparent' },
  playerEyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 3 },
  playerTitle: { fontSize: 15, fontWeight: '800' },
  spotifyDescription: { fontSize: 12, lineHeight: 18, marginBottom: 15 },
  spotifyButton: { minHeight: 46, borderRadius: 23, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9 },
  spotifyButtonText: { flex: 1, color: '#061006', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  webViewFrame: { height: 180, borderRadius: 12, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  webView: { flex: 1, backgroundColor: '#FFFFFF' },
  openButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1, borderRadius: 12, marginTop: 12 },
  openButtonText: { fontSize: 12, fontWeight: '800' },
  noteCard: { borderWidth: 1, borderRadius: 13, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 16 },
  noteText: { flex: 1, fontSize: 10, lineHeight: 16 },
});
