# Gameshow Widget Plug-ins
*Gameshow* presentation can be extended with widget plug-ins implemented using common web development technologies.  The plug-in widget rendering is carried out by *Gameshow* via *Chromium Embedded Framework* on Mac and Windows.  The widget settings UI is presented via *WebKit* on Macs, and *CEF* on Windows.  Widget plug-in developers are assumed to be familiar with XML, HTML, Javascript, and JSON.

## Widget plug-in discovery
*Gameshow* will load widget plug-ins from the following locations on Windows:
- `C:\Program Files\Telestream\Gameshow\eva_plugins\Sources\WidgetSDK` for built-in widgets that ship with *Gameshow*.
- `C:\Users\Public\Documents\Gameshow\WidgetSDK` for user installed third party widgets.

*Gameshow* will load widget plug-ins from the following locations on Macs:
- `Gameshow.app/Contents/PlugIns/Sources/WidgetSDK` for built-in widgets that ship with *Gameshow*.
- `~/Library/Application Support/Gameshow/WidgetSDK` for user installed third party widgets.

## Widget plug-in folder anatomy
Below is an example of a typical folder layout for a widget plug-in.
```
simplecountdown
├── countdown-settings.html
├── countdown.html
├── css
│   ├── countdown-settings.css
│   └── countdown.css
├── description.xml
├── images
│   └── logo.png
└── scripts
    ├── countdown-settings.js
    └── countdown.js
```

Gameshow expects to find the plug-in manifest inside the plug-in folder, and it *must* be named `description.xml`.  The contents of this particular manifest are shown below.

```
<?xml version="1.0" encoding="UTF-8"?>
<widget name="simplecountdown"
		display_name="Countdown"
		version="1.0"
		creator="Telestream"
		authentication_type=""
		min_width="128"
		min_height="128" 
		settings_page="countdown-settings.html"
		start_page="countdown.html"
		settings_height="200"
		provides_renderer_geometry="false"
		api_version="1">
</widget>
```

* `name` attribute specifies a plug-in ID.  It should be unique.
* `display_name` attribute specifies a widget name that will be displayed in *Gameshow*.
* `version` attribute specifies release version of the plug-in.  This is required.  This should be numerical only and contain up to 3 fields (`major[.minor[.patch]]`).  For example, `1.0.0`.
* `creator` attribute identifies the organization or authors of the plug-in.  This is required.
* `authentication_type` is an optional attribute that may be used to group widgets together in a sub-menu. Currently only *"twitch"* is recognized.
* `start_page` attribute specifies the main widget rendering component.  This is the part of the widget that is rendered and composited into the shot.  Default value is `index.html`.
* `min_width` and `min_height` attributes specify the minimum resolution of the rendering component.  Default value is `640` for `min_width` and `480` for `min_height`.
* `settings_page` is an optional attribute that specifies the widget settings component.  This part of the widget is presented to the user in the *Shot Properties Inspector* / *Source Settings* page.  Whether the widget requires any configuration settings is entirely up to the widget authors.  Default value is `settings.html`.
* `settings_height` is an optional attribute that specifies the suggested minimum height of the Gameshow container widget used to host the plug-in settings UI.  Default value is `480`.  The widget may change its height requirements dynamically via `_runtime` parameter as discussed in *Interaction between widget plug-in and Gameshow*.
* `provides_renderer_geometry` is an optional attribute indicating whether widget rendering component can calculate its own size, allowing renderer `width` and `height` to be unconstrained in *Gameshow* and to change dynamically at runtime.  This is discussed in more detail in *Interaction between widget plug-in and Gameshow*.
* `api_version` attribute specifies the version of the host API.  This is required and should always be set to `1`.

While some of the plug-in folder layout is specified in the manifest, the settings UI and widget rendering components may reference additional files.  In the example given here `countdown-settings.html` references two other files included in the plug-in folder, as shown below.
```
<link rel="stylesheet" type="text/css" href="css/countdown-settings.css">
<script type="text/javascript" src="scripts/countdown-settings.js" ></script>
```

The widget rendering component may reference some of the same and additional files in the plug-in folder. Here *Twitch OAuth Test* settings stylesheet is referenced by the rendering component for code re-use.
```
<link rel="stylesheet" href="css/auth-settings.css">
<link rel="stylesheet" href="css/auth.css">
<script type="text/javascript" src="scripts/auth.js"></script>
```

Additional assets (images, jQuery, etc...) may be included in the plug-in folder; this is left entirely up to the plug-in authors.

## Interaction between widget plug-in and Gameshow
*Gameshow* keeps independent instances of widget components -- the settings UI component, and the rendering component.  These components are executed in separate embedded browser instances. *Gameshow* receives configuration parameters from the settings component and serializes them to JSON.  Serialized parameters are deserialized from JSON and passed to the rendering component.  The settings component and rendering component never communicate directly within *Gameshow*.

Below is an example of the *Countdown* widget settings.
```
{
  "startSeconds": "11",
  "stopSeconds": "0",
  "delaySeconds": "1",
  "_runtime": {
    "geometry": {
      "width": 1430,
      "height": 107
    }
  }
}
```

In the listing above all keys (except `_runtime`) are rendering component configuration parameters, and their interpretation is left entirely up to the widget author.

The purpose of the `_runtime` parameter is to notify *Gameshow* about the minimum container height required to hold the widget settings UI.  While all other parameters are merely passed along to the rendering component, the `_runtime` parameter is interpreted by *Gameshow*.  The `_runtime` parameter may be supplied by widget author using the following snippet of code.
```
settings._runtime = {
	geometry: {
		width: document.documentElement.scrollWidth,
		height: document.documentElement.scrollHeight
	}
};
```

*Gameshow* must be notified whenever the user changes a setting value.  This can be accomplished via the snippet of code shown below.
```
if (window.hostApp) {
	window.hostApp.execute('apply_widget_settings', JSON.stringify(settings));
}
```

*Gameshow* will call `SetWidgetSettings(settings, applicationInfo)` for both the settings component and the rendering component.  For the settings component it is called to (re)initialize the settings UI with the previously saved values.  For the rendering component it is called to pass widget settings to the rendering component.

*Gameshow* will call `GetWidgetSettings()` for the rendering component, and may call it for the settings component.  For the rendering component it will be called when exporting a document template.  Document templates should not include any sensitive widget settings (passwords, access keys, fragile URLs, etc...) -- these should be listed in `settings._template_exclude` array.  Below is a listing of a sample settings object that contains a couple of settings (`text_filepath`, and `_private.access_key`) that should not be part of the exported template.
```
{
  "text_source": "FILE",
  "text": "dGhpcyVDMiVBMGlzJUMyJUEwKG5vdCVDMiVBMGxpdmUpJUMyJUEwdGV4dCUyQyVDMiVBMG9uZSVDMiVBMGxpbmVyJTBBJTBBJTBBNHRoJUMyJUEwbGluZSUwQQ==",
  "text_filepath": "file:///Some/Non/Portable/Path/To/current-date-time.txt",
  "_private": { "access_key": "SomeSecretKey" },
  "_template_exclude": [
    "text_filepath",
    "_private.access_key"
  ]
}
```
Note that if `settings._template_exclude` is omitted then none of the widget settings will be included in the exported template.  Similarly, if `settings._template_exclude` is present and its value is an empty array (`settings._template_exclude = [];`) then all of the widget settings will be included in the exported template.

*Gameshow* will supply OAuth access tokens for Twitch or YouTube (depending on which service the user is logged in to) in the `applicationInfo` parameter passed to `SetWidgetSettings(settings, applicationInfo)`.  Below is a listing of a sample value of `applicationInfo`.
```
{
  "twitch_channel_name": "test_channel",
  "oauth_access_token": "some_auth_token"
}
```

### Widgets with content-defined size
*Gameshow* can accommodate plug-in widgets with an implicitly defined width and height.  An example of this would be a text rendering widget where the size of the rendering component depends on the font settings, the text being rendered, whether the width of the rendering component is unconstrained or fixed, and whether line wrapping is enabled.  A widget can indicate to *Gameshow* that it can calculate the size of its rendering component by adding `provides_renderer_geometry="true"` to `description.xml`.  A widget that supports implicit sizing will need to examine `settings._renderer` record to see how its geometry has been constrained (`width_constrained`, `height_constrained`, `client_width`, `client_height`).  When `width` is constrained the *Gameshow* widget should reference `_renderer.client_width` for the expected renderer width value.  Note that `width_constrained`, `height_constrained`, `client_width` and `client_height` are values supplied by *Gameshow* to inform the widget about the intended layout behavior.  *Gameshow* will ignore these values when it receives widget settings.  The widget is expected to provide its unconstrained implicit `width` and `height` in `_renderer.geometry` record when it submits settings to *Gameshow*.  Also required is `_renderer.constrained_width_geometry` which should provide the `height` of the renderer component required to accommodate (possibly line-wrapped) content within the `_renderer.client_width` constraint.  Below is an excerpt of the `settings._renderer` record for the Text widget that ships with *Gameshow*.
```
{
  "_renderer": {
    "width_constrained": false,
    "height_constrained": false,
    "client_width": 1920,
    "client_height": 1080,
    "geometry": {
      "width": 1731,
      "height": 672
    },
    "constrained_width_geometry": {
      "width": 1731,
      "height": 672
    }
  }
}
```

#### File selection from a widget plug-in
*Gameshow* hostApp API allows plug-ins to prompt the user for file selection and to receive the selection result as a list of `file://` URLs.  Below is an example of single-file selection of arbitrary files:
```
	obj.selectTextSourceFile = function () {
		if (window.hostApp)	{
			var options = { allowsMultipleSelection: false };
			window.hostApp.execute('openFileDialog', JSON.stringify(options));
		}
	};
```

Selection result is delivered via a call to `hostAppCallback(commandName, commandResult)`, where `commandName` is set to `'receiveSelectedFileURLs'` and `commandResult` includes stringified JSON array of selected file URLs.
```
	obj.hostAppCallbackHandlers = {
		receiveSelectedFileURLs: function (commandResult) {
			var files = JSON.parse(commandResult);
			if (files.length > 0) {
				var settings = obj.currentSettings();
				settings.text_filepath = files[0];
			}
		}
	};

    /* . . . */

function hostAppCallback(commandName, commandResult) {
	var ws = WidgetSettingsSingleton();
	var callbackHandler = ws.hostAppCallbackHandlers[commandName];
	if (callbackHandler) {
	    callbackHandler(commandResult);
	}
}
```

Note that *Gameshow* hostApp `openFileDialog` command supports several configuration options:
- `allowsMultipleSelection` option can be set to `true` or `false`.
- `initialDirectory` option can be set to `'AUDIO'`, `'IMAGE'`, `'VIDEO'`, `'HOME'`, `'DESKTOP'`, `'file://Some/File/Path...'`.
- `fileTypeClass` option can be set to `'AUDIO_FILETYPE'`, `'IMAGE_FILETYPE'`, `'VIDEO_FILETYPE'`, `'MEDIA_FILETYPE'`.  `'MEDIA_FILETYPE'` implies selection of audio, video, and image files. 
- `fileTypes` option can be used to specify a list of eligible file extensions, for example `'.jpg;.png'`.  Note that `fileTypeClass` and `fileTypes` are mutually exclusive.


## Plug-in widget look and feel within Gameshow
*Gameshow* tries to maintain a consistent look and feel between plug-in widget settings controls and the rest of the *Gameshow* UI.  This is accomplished by injecting a stylesheet into the embedded browser instance hosting the widget settings component, and the rendering component.  The CSS injected into the settings component instance is different depending on the area of the UI where the widget settings are being presented -- the *Shot Properties Inspector* panel uses dark backgrounds and is more customized, while the *Source Settings* dialog maintains native look and feel.

On Macs these stylesheets can be found at the following locations:
- `Gameshow.app/Contents/Resources/widget-preview-settings.css` for properties inspector panel.
- `Gameshow.app/Contents/Resources/widget-mac-settings.css` for source settings dialog.

On Windows the stylesheets can be found here:
- `C:\Program Files\Telestream\Gameshow\rsrc\widget-preview-settings.css` for properties inspector panel.
- `C:\Program Files\Telestream\Gameshow\rsrc\widget-windows-settings.css` for source settings dialog.

These files may be referenced during plug-in widget development for testing purposes only, and should not be referenced directly by the widget in the final deployed plug-in.

The built-in widgets that are shipped with *Gameshow* maintain consistent look and feel of the various controls by following a few simple conventions outlined below.
- The controls are laid out in a form as a set of rows.
- Each row lays out setting label on the left (right-justified) and value on the right (left-justified).
- The width of the setting label column is typically `7em`.
- The width of the setting value column is `11em` for settings that need more space, `7.3em` for shorter setting values, and `3.2em` for really small setting values.
- The gap between setting label and setting value is `0.5em`.

These conventions are embodied in the common stylesheet referenced by the built-in *Gameshow* widget plug-ins.  You can find this stylesheet at `Gameshow.app/Contents/PlugIns/Sources/WidgetSDK/common/css/settings.css` on Macs, and `C:\Program Files\Telestream\Gameshow\eva_plugins\Sources\WidgetSDK\common\css\settings.css` on Windows.

Additionally, built-in widgets use a common set of controls.  In particular this applies to the color selection functionality provided by [https://github.com/PitPik/tinyColorPicker](https://github.com/PitPik/tinyColorPicker).  In order to maintain consistent look and feel, plug-in developers are encouraged to choose the same controls as used by the built-in plug-ins whenever there are multiple choices of controls available.



