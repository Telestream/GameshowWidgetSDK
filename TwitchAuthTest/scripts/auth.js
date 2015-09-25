var gWidgetSettings = {
	showImage: true,
	showDisplayName: true,
	showEmail: true
};

var gAppInfo = null;

function renderer_update_view()
{
	if (gWidgetSettings != null)
	{
		if (gWidgetSettings.showDisplayName)
		{
			$("#username_group").show();
		}
		else
		{
			$("#username_group").hide();
		}

		if (gWidgetSettings.showImage)
		{
			$("#twitch_image_group").show();
		}
		else
		{
			$("#twitch_image_group").hide();
		}

		if (gWidgetSettings.showEmail)
		{
			$("#email_group").show();
		}
		else
		{
			$("#email_group").hide();
		}
	}

	if (gAppInfo != null && gAppInfo.oauth_access_token != null)
	{
		var accessToken = gAppInfo.oauth_access_token;

		// described at https://github.com/justintv/Twitch-API/blob/master/v3_resources/users.md
		// authenticated and requires scope user_read
		$.ajax({
		    url: "https://api.twitch.tv/kraken/user",
			type: "GET",
			dataType: "json",
			headers:
			{
				"Accept": "application/vnd.twitchtv.v3+json",
				"Authorization": "OAuth "+accessToken
			}
		}).done(function (json) {
		    document.getElementById("username").innerText = json.display_name;
		    document.getElementById("email").innerText = json.email;
			document.getElementById("twitch_image").alt = "avatar";
		    document.getElementById("twitch_image").src = json.logo;
	    })
	}
	else
	{
		document.getElementById("username").innerText = "NOT AUTHENTICATED"
		document.getElementById("email").innerText = "NOT AUTHENTICATED"
		document.getElementById("twitch_image").alt = "NOT AUTHENTICATED";
		document.getElementById("twitch_image").src = "";
	}
}

// This will also be called by the host app *Gameshow* to pass widget configuration
// parameters from widget settings component to the renderer component (this component).
function SetWidgetSettings(widgetSettings, appInfo)
{
	if (widgetSettings != null)
	{
		gWidgetSettings = widgetSettings;
	}

	if (appInfo != null)
	{
		gAppInfo = appInfo;
	}

	renderer_update_view();
}
