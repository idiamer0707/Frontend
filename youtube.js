const clientId = '47331039917-5heqfuko19cvc2le94t53mr1ad4f9hml.apps.googleusercontent.com';
const clientSecret = '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';
const redirectUri = 'https://idiamer0707.github.io/Frontend/';
const scope = 'https://www.googleapis.com/auth/youtube';
 
let accessToken = '';

window.addEventListener('load', async () => {
    // Recuperar el token guardado en sessionStorage
    const savedAccessToken = sessionStorage.getItem('accessToken');
    const savedChannelData = JSON.parse(sessionStorage.getItem('channelData'));
    const savedVideoStats = JSON.parse(sessionStorage.getItem('videoStats'));
  
    console.log("Token guardado:", savedAccessToken);
    console.log("Datos del canal guardados:", savedChannelData);
    console.log("Estadísticas de videos guardadas:", savedVideoStats);
  
    if (savedAccessToken) {
      // Si hay un token guardado, realiza los fetch con ese token
      if (savedChannelData && savedVideoStats) {
        // Mostrar los datos guardados
        displayChannelData(savedChannelData);
        displayVideoStats(savedVideoStats);
      } else {
        // Si no hay datos guardados, realiza los fetch con el token
        await fetchUserChannelData(savedAccessToken);
        await fetchVideoStatistics(savedAccessToken);
      }
    } else {
      // Detectar si hay un nuevo token en la URL
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hashParams.get('access_token');
  
      if (accessToken) {
        // Guardar el token en sessionStorage y usarlo para los fetch
        sessionStorage.setItem('accessToken', accessToken);
        console.log("Autenticación completada con éxito. Nuevo token guardado.");
  
        await fetchUserChannelData(accessToken);
        await fetchVideoStatistics(accessToken);
      } else {
        // Si no hay token, mostrar mensaje de inicio de sesión
        displayLoginPrompt();
      }
    }
  });

window.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.getElementById('btn-login-youtube');
    if (loginButton) {
      loginButton.addEventListener('click', () => {
        startAuthFlow();
      });
    } else {
      console.error("El botón con id 'btn-login-youtube' no existe en el DOM.");
    }
});

function startAuthFlow() {
  const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=token`;
  window.location.href = authUrl;
}

// Función para obtener los datos del canal
async function fetchUserChannelData() {
  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true&access_token=${accessToken}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      document.getElementById('output2').innerText = 'No se encontró ningún canal asociado a esta cuenta.';
      return;
    }

    const channel = data.items[0];
    const channelData = {
      channelName: channel.snippet.title,
      subscribers: channel.statistics.subscriberCount,
      views: channel.statistics.viewCount,
      channelId: channel.id
    };

    // Guardar los datos del canal en sessionStorage
    sessionStorage.setItem('channelData', JSON.stringify(channelData));
    console.log("datos guardados ",channelData)

    // Mostrar los datos
    displayChannelData(channelData);
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('output2').innerText = 'Ocurrió un error al obtener los datos del canal.';
  }
}

// Función para obtener estadísticas de videos
async function fetchVideoStatistics() {
  try {
    const channelData = JSON.parse(sessionStorage.getItem('channelData'));
    const channelId = channelData.channelId;
    let videos = [];
    let nextPageToken = '';

    // Obtener todos los videos públicos del canal
    do {
      const videosUrl = `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${channelId}&maxResults=50&type=video&pageToken=${nextPageToken}&access_token=${accessToken}`;
      const videosResponse = await fetch(videosUrl);
      const videosData = await videosResponse.json();

      if (videosData.items) {
        const videoIds = videosData.items.map(video => video.id.videoId);
        videos = videos.concat(videoIds);
      }

      nextPageToken = videosData.nextPageToken;
    } while (nextPageToken);

    // Obtener estadísticas de los videos
    let totalLikes = 0;
    let totalComments = 0;

    for (let i = 0; i < videos.length; i += 50) {
      const chunk = videos.slice(i, i + 50).join(',');
      const videosStatsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${chunk}&access_token=${accessToken}`;
      const statsResponse = await fetch(videosStatsUrl);
      const statsData = await statsResponse.json();

      if (statsData.items) {
        statsData.items.forEach(video => {
          totalLikes += parseInt(video.statistics.likeCount || 0);
          totalComments += parseInt(video.statistics.commentCount || 0);
        });
      }
    }

    // Guardar estadísticas en sessionStorage
    const videoStats = { totalLikes, totalComments };
    sessionStorage.setItem('videoStats', JSON.stringify(videoStats));

    // Mostrar los datos en el HTML
    displayVideoStats(videoStats);
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('output2').innerText = 'Ocurrió un error al obtener las estadísticas de los videos.';
  }
}

// Función para mostrar datos del canal en el HTML
function displayChannelData(channelData) {
    if (channelData) {
      // Mostrar datos del canal
      document.getElementById('subs').innerText = `Número de suscriptores: ${channelData.subscribers}`;
      document.getElementById('views').innerText = `Número de visualizaciones: ${channelData.views}`;
  
      // Asegurarse de mostrar el contenedor de datos y ocultar el mensaje
      document.getElementById('youtubeData').style.display = 'block';
      document.getElementById('youtubeMessage').style.display = 'none';
    } else {
      // Mostrar mensaje de inicio de sesión
      displayLoginPrompt();
    }
  }
  
  // Función para mostrar estadísticas de videos en el HTML
  function displayVideoStats(videoStats) {
    if (videoStats) {
      // Mostrar estadísticas de videos
      document.getElementById('likes').innerText = `Número total de likes: ${videoStats.totalLikes}`;
      document.getElementById('comments').innerText = `Número total de comentarios: ${videoStats.totalComments}`;
  
      // Asegurarse de mostrar el contenedor de datos y ocultar el mensaje
      document.getElementById('youtubeData').style.display = 'block';
      document.getElementById('youtubeMessage').style.display = 'none';
    } else {
      // Mostrar mensaje de inicio de sesión
      displayLoginPrompt();
    }
  }
  
  // Función para mostrar mensaje de inicio de sesión
  function displayLoginPrompt() {
    // Ocultar el contenedor de datos y mostrar el mensaje
    document.getElementById('youtubeData').style.display = 'none';
    document.getElementById('youtubeMessage').style.display = 'block';
  }
