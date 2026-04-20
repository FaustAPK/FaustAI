package com.faust.ai // Изменён пакет

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.uimanager.DisplayMetricsHolder
import androidx.core.view.WindowCompat   // для edge-to-edge до API 35
import android.content.res.Configuration
import android.os.Bundle

class MainActivity : ReactActivity() {

    /**
     * Возвращает имя главного компонента, зарегистрированного в JavaScript.
     * Используется для планирования рендеринга компонента.
     */
    override fun getMainComponentName(): String = "FaustAI" // Изменено с "PocketPal"

    /**
     * Возвращает экземпляр [ReactActivityDelegate].
     * Используем [DefaultReactActivityDelegate], который позволяет включить Новую Архитектуру
     * с помощью одного булевого флага [fabricEnabled].
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    override fun onCreate(savedInstanceState: Bundle?) {
        // Предотвращает восстановление фрагментов react-native-screens после завершения процесса.
        // Исправляет ошибку "Screen fragments should never be restored"
        // См.: https://github.com/software-mansion/react-native-screens/issues/17
        // и https://github.com/software-mansion/react-native-screens?tab=readme-ov-file#android
        super.onCreate(null)

        fixExternalDisplayDensity()

        WindowCompat.enableEdgeToEdge(window)  // включает E2E для версий до Android 15
        // Опционально: полностью прозрачная панель навигации (может снизить контрастность для навигации с тремя кнопками)
        // window.isNavigationBarContrastEnforced = false
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        fixExternalDisplayDensity()
    }

    /**
     * Исправляет плотность пикселей для внешних дисплеев (Samsung DeX, Pixel Desktop Mode).
     *
     * RN's DisplayMetricsHolder.initDisplayMetrics() устанавливает screenDisplayMetrics через
     * wm.defaultDisplay.getRealMetrics(), который всегда считывает данные с дисплея телефона
     * (например, 420dpi). PixelUtil использует screenDisplayMetrics для всех преобразований dp в px,
     * что приводит к отображению всего в ~4 раза крупнее на внешнем мониторе с меньшей плотностью.
     *
     * windowDisplayMetrics (из контекста Application) имеет правильную плотность, поэтому мы
     * копируем её. Этот метод запускается в onCreate и onConfigurationChanged, потому что RN
     * переинициализирует метрики при изменениях ориентации/размера.
     */
    private fun fixExternalDisplayDensity() {
        try {
            val screenMetrics = DisplayMetricsHolder.getScreenDisplayMetrics()
            val windowMetrics = DisplayMetricsHolder.getWindowDisplayMetrics()
            if (screenMetrics.densityDpi != windowMetrics.densityDpi) {
                screenMetrics.densityDpi = windowMetrics.densityDpi
                screenMetrics.density = windowMetrics.density
                screenMetrics.scaledDensity = windowMetrics.scaledDensity
            }
        } catch (_: Exception) {
            // DisplayMetricsHolder ещё не инициализирован — нормально для дисплея телефона
        }
    }
}