package com.faust.ai // Изменён пакет

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.facebook.soloader.SoLoader
// Импорты кастомных пакетов (они остались в старом пакете com.pocketpal)
import com.pocketpal.KeepAwakePackage
import com.pocketpal.HardwareInfoPackage
import com.pocketpal.StorefrontPackage
import com.pocketpal.download.DownloadPackage

class MainApplication : Application(), ReactApplication {

    override val reactNativeHost: ReactNativeHost =
        object : DefaultReactNativeHost(this) {
            override fun getPackages(): List<ReactPackage> =
                PackageList(this).packages.apply {
                    // Пакеты, которые не могут быть автоматически подключены, можно добавить вручную здесь, например:
                    // add(MyReactNativePackage())
                    add(KeepAwakePackage())
                    add(HardwareInfoPackage())
                    add(StorefrontPackage())
                    add(DownloadPackage())
                }

            override fun getJSMainModuleName(): String = "index"

            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
        }

    override val reactHost: ReactHost
        get() = getDefaultReactHost(applicationContext, reactNativeHost)

    override fun onCreate() {
        super.onCreate()
        SoLoader.init(this, OpenSourceMergedSoMapping)
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // Если вы выбрали Новую Архитектуру, загружаем нативную точку входа для этого приложения.
            load()
        }
    }
}