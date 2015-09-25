var gWidgetSettings = {
	startSeconds: "10",
	stopSeconds: "0",
	delaySeconds: 1
};

// This will also be called by the host app *Gameshow* to pass widget configuration
// parameters from widget settings component to the renderer component (this component).
function SetWidgetSettings(widgetSettings, appInfo)
{
	gWidgetSettings = widgetSettings;
	currentSeconds = gWidgetSettings.startSeconds;
}

function updateCountdown()
{
    if (currentSeconds == gWidgetSettings.stopSeconds)
	{
		document.getElementById("countdown").style.display = 'none';
	    document.getElementById("countdown-succeeded").style.display = 'inline';

	    currentSeconds = gWidgetSettings.startSeconds;
    }
	else
	{
		document.getElementById("countdown").innerHTML = currentSeconds;
		document.getElementById("countdown").style.display = 'inline';
	    document.getElementById("countdown-succeeded").style.display = 'none';

		currentSeconds--;
    }
	
    setTimeout(updateCountdown, 1000 * gWidgetSettings.delaySeconds);
}

window.onload = function() {
	
	currentSeconds = gWidgetSettings.startSeconds;

	// use setTimeout instead of setInterval so we can adjust delay on the fly
    setTimeout(updateCountdown, 1000 * gWidgetSettings.delaySeconds);
}
