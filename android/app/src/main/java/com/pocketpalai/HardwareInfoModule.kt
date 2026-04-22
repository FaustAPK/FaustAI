package com.pocketpal

import com.facebook.react.bridge.*
import android.os.Build
import android.os.Debug
import java.io.File
import java.util.regex.Pattern
import android.opengl.GLES20
import javax.microedition.khronos.egl.EGL10
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.egl.EGLContext
import javax.microedition.khronos.egl.EGLDisplay
import android.app.ActivityManager
import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

class HardwareInfoModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "HardwareInfo"

    @ReactMethod
    fun getChipset(promise: Promise) {
        try {
            val chipset = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                Build.SOC_MODEL.takeUnless { it.isNullOrEmpty() }
                    ?: Build.HARDWARE.takeUnless { it.isNullOrEmpty() }
                    ?: Build.BOARD
            } else {
                Build.HARDWARE.takeUnless { it.isNullOrEmpty() } ?: Build.BOARD
            }
            promise.resolve(chipset)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun getGPUInfo(promise: Promise) {
        try {
            val gpuInfo = Arguments.createMap()
            var renderer = ""
            var vendor = ""
            var version = ""

            try {
                val egl = EGLContext.getEGL() as EGL10
                val display = egl.eglGetDisplay(EGL10.EGL_DEFAULT_DISPLAY)
                if (display != EGL10.EGL_NO_DISPLAY) {
                    val version_array = IntArray(2)
                    egl.eglInitialize(display, version_array)
                    val configsCount = IntArray(1)
                    val configs = arrayOfNulls<EGLConfig>(1)
                    val configSpec = intArrayOf(EGL10.EGL_RENDERABLE_TYPE, 4, EGL10.EGL_NONE)
                    egl.eglChooseConfig(display, configSpec, configs, 1, configsCount)
                    if (configsCount[0] > 0) {
                        val context = egl.eglCreateContext(display, configs[0], EGL10.EGL_NO_CONTEXT, intArrayOf(0x3098, 2, EGL10.EGL_NONE))
                        if (context != null && context != EGL10.EGL_NO_CONTEXT) {
                            val surfaceAttribs = intArrayOf(EGL10.EGL_WIDTH, 1, EGL10.EGL_HEIGHT, 1, EGL10.EGL_NONE)
                            val surface = egl.eglCreatePbufferSurface(display, configs[0], surfaceAttribs)
                            if (surface != null && surface != EGL10.EGL_NO_SURFACE) {
                                egl.eglMakeCurrent(display, surface, surface, context)
                                renderer = GLES20.glGetString(GLES20.GL_RENDERER) ?: ""
                                vendor = GLES20.glGetString(GLES20.GL_VENDOR) ?: ""
                                version = GLES20.glGetString(GLES20.GL_VERSION) ?: ""
                                egl.eglMakeCurrent(display, EGL10.EGL_NO_SURFACE, EGL10.EGL_NO_SURFACE, EGL10.EGL_NO_CONTEXT)
                                egl.eglDestroySurface(display, surface)
                            }
                            egl.eglDestroyContext(display, context)
                        }
                    }
                    egl.eglTerminate(display)
                }
            } catch (e: Exception) { }

            gpuInfo.putString("renderer", renderer)
            gpuInfo.putString("vendor", vendor)
            gpuInfo.putString("version", version)

            val rendererLower = renderer.lowercase()
            val hasAdreno = Pattern.compile("(adreno|qcom|qualcomm)").matcher(rendererLower).find()
            val hasMali = Pattern.compile("mali").matcher(rendererLower).find()
            val hasPowerVR = Pattern.compile("powervr").matcher(rendererLower).find()

            gpuInfo.putBoolean("hasAdreno", hasAdreno)
            gpuInfo.putBoolean("hasMali", hasMali)
            gpuInfo.putBoolean("hasPowerVR", hasPowerVR)
            gpuInfo.putBoolean("supportsOpenCL", hasAdreno)

            val gpuType = when {
                hasAdreno -> "Adreno (Qualcomm)"
                hasMali -> "Mali (ARM)"
                hasPowerVR -> "PowerVR (Imagination)"
                renderer.isNotEmpty() -> renderer
                else -> "Unknown"
            }
            gpuInfo.putString("gpuType", gpuType)

            promise.resolve(gpuInfo)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun getCPUInfo(promise: Promise) {
        // (оставь существующую реализацию, она не зависит от specs)
        // ...
    }

    @ReactMethod
    fun getAvailableMemory(promise: Promise) {
        try {
            val activityManager = reactApplicationContext.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
            val memInfo = ActivityManager.MemoryInfo()
            activityManager.getMemoryInfo(memInfo)
            promise.resolve(memInfo.availMem.toDouble())
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }

    @ReactMethod
    fun writeMemorySnapshot(label: String, promise: Promise) {
        // (оставь существующую реализацию)
        // ...
    }
}