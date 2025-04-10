const appIdpagina = '1862052411210390'; 
const scopepagina = 'public_profile,pages_show_list,pages_read_engagement,pages_read_user_content,pages_manage_posts,business_management,instagram_basic,instagram_manage_comments,instagram_manage_insights'; 

// Inicializar el SDK de Facebook
function initFacebookSDK(appId) {
    FB.init({
        appId            : appId, 
        cookie           : true,   
        xfbml            : true,    
        version          : 'v22.0'   
    });
    console.log(`SDK inicializado con App ID: ${appId}`);
}

// Realizar el login con permisos de páginas
function loginWithPage(appId) {
    initFacebookSDK(appId);

    FB.login(function(response) {
        if (response.authResponse) {
            console.log('Usuario autenticado correctamente:', response);

            const token = response.authResponse.accessToken;
            console.log('Token de acceso (Usuario):', token);

            // Guardar el token en sessionStorage
            sessionStorage.setItem('facebookAccessToken', token);

            // Obtener datos de la cuenta de usuario
            FB.api('/me?fields=id,name', function(accountData) {
                if (accountData && !accountData.error) {
                    console.log('Datos de la cuenta:', accountData);

                    // Guardar datos de la cuenta en sessionStorage
                    sessionStorage.setItem('facebookAccountData', JSON.stringify(accountData));

                } else {
                    console.error('Error al obtener datos de la cuenta:', accountData.error);
                }
            });

            // Obtener datos de las páginas administradas
            FB.api('/me/accounts?fields=access_token,followers_count,instagram_business_account', function(pageData) {
                if (pageData && !pageData.error) {
                    console.log('Datos de las páginas administradas:', pageData.data);

                    const page = pageData.data[0]; // Solo consideramos la primera página

                    if (page) {
                        const pageToken = page.access_token;
                        const followers = page.followers_count;
                        const pageId = page.id;
                        const instaId = page.instagram_business_account.id;

                        // Guardar datos de la página en sessionStorage
                        const pageInfo = {
                            pageToken,
                            followers,
                            pageId,
                            instaId,
                        };
                        sessionStorage.setItem('facebookPageData', JSON.stringify(pageInfo));

                        // Obtener datos de Instagram vinculados
                        FB.api(`/${instaId}?fields=followers_count,media_count,username`, function(instaData) {
                            if (instaData && !instaData.error) {
                                console.log('Datos de Instagram:', instaData);

                                // Guardar datos de Instagram en sessionStorage
                                sessionStorage.setItem('instagramData', JSON.stringify(instaData));

                                // Obtener posts de Instagram
                                fetchInstagramPosts(instaId);
                            } else {
                                console.error('Error al obtener datos de Instagram:', instaData.error);
                            }
                        });

                        // Obtener posts de la página de Facebook
                        fetchFacebookPosts(pageId, pageToken);
                    } else {
                        document.getElementById('pageid').innerText = 'No se encontraron páginas administradas.';
                    }
                } else {
                    console.error('Error al obtener datos de las páginas:', pageData.error);
                }
            });
        } else {
            console.log('Autenticación cancelada.');
        }
    }, { scope: scopepagina });
}

// Obtener los posts de Instagram y guardar en sessionStorage
function fetchInstagramPosts(instaId) {
    FB.api(`/${instaId}/media`, function(mediaList) {
        if (mediaList && !mediaList.error && mediaList.data.length > 0) {
            console.log('Lista de posts recibida de Instagram:', mediaList.data);

            let totalLikesI = 0;
            let totalCommentsI = 0;
            let totalvistasI = 0;

            const promises = mediaList.data.map(post => {
                return new Promise((resolve, reject) => {
                    FB.api(`/${post.id}/insights?metric=likes,comments,views`, function(insights) {
                        if (insights && !insights.error && insights.data.length > 0) {
                            const likes = insights.data[0].values[0].value;
                            const comments = insights.data[1].values[0].value;
                            const vistas = insights.data[2].values[0].value;

                            totalLikesI += likes;
                            totalCommentsI += comments;
                            totalvistasI += vistas;

                            resolve();
                        } else {
                            console.error('Error al obtener datos del post de Instagram:', insights.error);
                            reject(insights.error);
                        }
                    });
                });
            });

            Promise.all(promises).then(() => {
                const instagramStats = {
                    totalLikes: totalLikesI,
                    totalComments: totalCommentsI,
                    totalViews: totalvistasI,
                };
                sessionStorage.setItem('instagramPostData', JSON.stringify(instagramStats));

            }).catch(error => {
                console.error('Error en la obtención de datos de los posts de Instagram:', error);
            });
        } else {
            console.error('Error al recibir la lista de posts de Instagram:', mediaList.error);
        }
    });
}

// Obtener los posts de la página de Facebook y guardar en sessionStorage
function fetchFacebookPosts(pageId, pageToken) {
    FB.api(`/${pageId}/posts?fields=comments.summary(total_count),reactions.summary(total_count)&access_token=${pageToken}`, function(postList) {
        if (postList && !postList.error) {
            console.log('Lista de posts recibida de Facebook:', postList.data);

            let totalLikes = 0;
            let totalComments = 0;
            let totalImpressions = 0;

            const promises = postList.data.map(post => {
                return new Promise((resolve, reject) => {
                    FB.api(`/${post.id}/insights?metric=post_impressions&access_token=${pageToken}`, function(insights) {
                        if (insights && !insights.error && insights.data.length > 0) {
                            const impressions = insights.data[0].values[0].value;
                            totalImpressions += impressions;
                            resolve();
                        } else {
                            console.error('Error al obtener datos de impresiones:', insights.error);
                            reject(insights.error);
                        }
                    });
                });
            });

            Promise.all(promises).then(() => {
                const facebookStats = {
                    totalLikes: totalLikes,
                    totalComments: totalComments,
                    totalImpressions: totalImpressions,
                };
                sessionStorage.setItem('facebookPostData', JSON.stringify(facebookStats));
            }).catch(error => {
                console.error('Error en la obtención de datos de los posts de Facebook:', error);
            });
        } else {
            console.error('Error al recibir la lista de posts de Facebook:', postList.error);
        }
    });
}

// Evento para el botón de inicio de sesión
document.getElementById('btn-login-facebook').addEventListener('click', () => {
    loginWithPage(appIdpagina);
});

function mostrartodo(){
    

}
