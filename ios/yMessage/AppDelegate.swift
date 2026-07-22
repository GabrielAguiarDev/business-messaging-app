import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    // Cor do badge da tab bar (primária #9079d7) em TODOS os estados. O
    // react-navigation só aplica a cor no estado "normal" do item via
    // UITabBarAppearance; o estado "selecionado" fica com badgeBackgroundColor
    // nil → o iOS usa o badgeColor do item (vermelho por padrão). Definir o
    // proxy de aparência aqui garante o roxo também na aba selecionada.
    UITabBarItem.appearance().badgeColor = UIColor(
      red: 144.0 / 255.0,
      green: 121.0 / 255.0,
      blue: 215.0 / 255.0,
      alpha: 1.0
    )

    factory.startReactNative(
      withModuleName: "yMessage",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
