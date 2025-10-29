package com.anonymous.rhynoapp // Or your package name

import android.os.Build
import android.os.Bundle

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled // For Fabric
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper // For Expo

class MainActivity : ReactActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        // Set the theme to AppTheme BEFORE onCreate to support
        // coloring the background, status bar, and navigation bar.
        // This is required for expo-splash-screen.
        setTheme(R.style.AppTheme);
        // Use super.onCreate(null) if you want to override splash screen behavior,
        // otherwise use super.onCreate(savedInstanceState)
        super.onCreate(savedInstanceState) // Standard way
    }

    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
     // 👇👇👇 THE MAIN FIX IS HERE 👇👇👇
    override fun getMainComponentName(): String = "Rhynoapp" // Use your app.json name

    /**
     * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
     * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate {
        // 👇 This uses the Expo wrapper, which is correct for Expo modules
        return ReactActivityDelegateWrapper(
            this,
            BuildConfig.IS_NEW_ARCHITECTURE_ENABLED, // Reads from build config
            object : DefaultReactActivityDelegate(
                this,
                mainComponentName, // Uses the function above
                fabricEnabled // Enables Fabric if New Arch is on
            ){}
        )
    }

    /**
      * Align the back button behavior with Android S
      * where moving root activities to background instead of finishing activities.
      * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
      */
    override fun invokeDefaultOnBackPressed() {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
            if (!moveTaskToBack(false)) {
                // For non-root activities, use the default implementation to finish them.
                super.invokeDefaultOnBackPressed()
            }
            return
        }

        // Use the default back button implementation on Android S
        // because it's doing more than [Activity.moveTaskToBack] in fact.
        super.invokeDefaultOnBackPressed()
    }
}