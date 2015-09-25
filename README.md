# Gameshow Widget Plug-ins
*Gameshow* presentation can be extended with widget plug-ins implemented using common web development technologies.  The plug-in widget rendering is carried out by *Gameshow* via *Chromium Embedded Framework* on Mac and Windows.  The widget settings UI is presented via *WebKit* on Macs, and *CEF* on Windows.  Widget plug-in developers are assumed to be familiar with XML, HTML, Javascript, and JSON.

## Widget plug-in discovery
*Gameshow* will load widget plug-ins from the following locations on Windows:
- `C:\Program Files\Telestream\Gameshow\eva_plugins\Sources\WidgetSDK` for built-in widgets that ship with *Gameshow*.
- `C:\Users\Public\Documents\Gameshow\WidgetSDK` for user installed third party widgets.

*Gameshow* will load widget plug-ins from the following locations on Macs:
- `Gameshow.app/Contents/PlugIns/Sources/WidgetSDK` for built-in widgets that ship with *Gameshow*.
- `/Library/Application Support/Gameshow/WidgetSDK` for user installed third party widgets.

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
* `api_version` attribute specifies the version of the host API.  This is required and should always be set to `1`.
* `api_version` attribute specifies the version of the host API.  This is required and should always be set to 1.

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

*Gameshow* will supply OAuth access tokens for Twitch or YouTube (depending on which service the user is logged in to) in the `applicationInfo` parameter passed to `SetWidgetSettings(settings, applicationInfo)`.  Below is a listing of a sample value of `applicationInfo`.
```
{
  "twitch_channel_name": "test_channel",
  "oauth_access_token": "some_auth_token"
}
```

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



