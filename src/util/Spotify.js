const clientId = '046038ff2a00427481f0b04710c8970e'
const redirectUri = "http://jammingaf.surge.sh"
const authUri = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&scope=playlist-modify-private&redirect_uri=${redirectUri}`


var userAccessToken

const Spotify = {

  getAccessToken() {
    if (userAccessToken) {
      return userAccessToken
    }

    let token = window.location.href.match(/access_token=([^&]*)/)
    let expiry = window.location.href.match(/expires_in=([^&]*)/)

    if (token && expiry) {
      userAccessToken = token[1]

      window.setTimeout(() => userAccessToken = null, expiry[1] * 1000)
      window.history.pushState('Access Token', null, '/')

    } else {
      window.location.href = authUri
    }
  },

  search(searchTerm) {
    const url = `https://api.spotify.com/v1/search?q=${searchTerm}&type=track`

    return fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + this.getAccessToken()
      }
    })
    .then(response => {
      if (response.ok) {
        return response.json()
      }

      throw new Error('Request failed!')

    }, networkError => console.log(networkError.message))
    .then(jsonResponse => {
      return jsonResponse.tracks.items.map(track => {
        return {
          name: track.name,
          artist: track.artists[0].name,
          album: track.album.name,
          id: track.id,
          uri: track.uri
        }
      })

    })
  },


  savePlaylist(name, uris) {
    if (name.length === 0 && uris.length === 0) {
      return
    }

    let accessToken = this.getAccessToken()
    let headers = {
      'Authorization': 'Bearer ' + accessToken
    }

    return fetch('https://api.spotify.com/v1/me', {
      headers: headers
    })
    .then(response => {
      if (response.ok) {
        return response.json()
      }

      throw new Error('Request failed!')

    }, networkError => console.log(networkError.message))
    .then(jsonResponse => {
      return jsonResponse.id

    })
    .then(id => {
      let url = `https://api.spotify.com/v1/users/${id}/playlists`

      return fetch(url, {
        headers: headers,
        method: 'POST',
        body: JSON.stringify({
          name: name
        })
      })

    })
    .then(response => {
      if (response.ok) {
        return response.json()
      }

      throw new Error('Request failed!')

    }, networkError => console.log(networkError.message))
    .then(jsonResponse => {
      let userID = jsonResponse.owner.id
      let playlistID = jsonResponse.id
      let url = `https://api.spotify.com/v1/users/${userID}/playlists/${playlistID}/tracks`

      return fetch(url, {
        headers: headers,
        method: 'POST',
        body: JSON.stringify({
          uris: uris
        })
      })
    })
    .then(response => {
      if (response.ok) {
        return response.json()
      }

      throw new Error('Request failed!')

    }, networkError => console.log(networkError.message))
  }
}

export default Spotify
