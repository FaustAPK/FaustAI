import com.pocketpal.HardwareInfoPackage

override fun getPackages(): List<ReactPackage> =
    PackageList(this).packages.apply {
        add(HardwareInfoPackage())
    }
