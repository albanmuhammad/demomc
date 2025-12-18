/******************************************************************
 *  HELPER FUNCTIONS
 ******************************************************************/

function extractCodeFromCityLabel(label) {
  if (!label) return null;
  var match = label.match(/\((.+?)\)/); // ambil teks di dalam (LOP)
  return match ? match[1].trim() : null;
}

function getFlightBasicInfo() {
  var $ = SalesforceInteractions.cashDom;

  var airlineName = $("p[data-testid='flightDetail-airline_name-label']")
    .text()
    .trim();
  var flightCode = $("p[data-testid='flightDetail-airline_code-label']")
    .text()
    .trim();
  var cabin = $("p[data-testid='flightDetail-airline_cabin-label']")
    .text()
    .trim();

  var departCityLabel = $("p[data-testid='flightTimeline-depart_city-label']")
    .text()
    .trim(); // "Lombok Praya (LOP)"
  var arriveCityLabel = $("p[data-testid='flightTimeline-arrival_city-label']")
    .text()
    .trim(); // "Bali Denpasar (DPS)"

  var depAirport = extractCodeFromCityLabel(departCityLabel); // LOP
  var arrAirport = extractCodeFromCityLabel(arriveCityLabel); // DPS

  var durationText = $(
    "[data-testid='flightTimeline-depart_flight_duration-label']"
  )
    .text()
    .trim(); // "0h 45m"

  return {
    airlineName: airlineName,
    flightCode: flightCode,
    cabin: cabin,
    departCityLabel: departCityLabel,
    arriveCityLabel: arriveCityLabel,
    depAirport: depAirport,
    arrAirport: arrAirport,
    durationText: durationText,
  };
}

function getFlightCategoryFromAirports(depAirport, arrAirport) {
  if (!depAirport || !arrAirport) return null;

  var domesticAirports = [
    "CGK",
    "HLP",
    "DPS",
    "SUB",
    "LOP",
    "UPG",
    "KNO",
    "SRG",
    "YIA",
    "BDO",
    "BPN",
    "PLM",
    "PDG",
    "BTH",
    "SOC",
    "JOG",
  ]; // contoh; silakan tambah sendiri

  var dep = depAirport.toUpperCase();
  var arr = arrAirport.toUpperCase();

  var depDomestic = domesticAirports.indexOf(dep) >= 0;
  var arrDomestic = domesticAirports.indexOf(arr) >= 0;

  if (depDomestic && arrDomestic) {
    return "FLIGHT_DOMESTIC"; // ID Category di Catalog
  } else {
    return "FLIGHT_INTERNATIONAL";
  }
}

function buildFlightIdFromPage() {
  var info = getFlightBasicInfo();
  // bebas: kombinasi airline + code + dep + arr
  var parts = [];
  if (info.airlineName) parts.push(info.airlineName);
  if (info.flightCode) parts.push(info.flightCode);
  if (info.depAirport) parts.push(info.depAirport);
  if (info.arrAirport) parts.push(info.arrAirport);
  return parts.join("_");
}

function getTotalPriceText() {
  var $ = SalesforceInteractions.cashDom;

  // selector baru: price_group_0-text
  var el = $("[data-testid='pricePanel-price_group_0-text']").first();

  // fallback ke selector lama kalau suatu saat markup berubah
  if (!el || el.length === 0) {
    el = $(
      "[data-testid='pricePanel-priceTotal-container'] p.font-bold"
    ).first();
  }

  var txt = el && el.length ? el.text().trim() : null; // contoh: "Rp 378.191"
  return txt || null;
}

// Helper baca query param dari URL (dipakai di promo click)
function parseFlightQueryFromUrl(href) {
  var result = {};
  try {
    var u = new URL(href, window.location.origin);
    var sp = u.searchParams;
    result.depAirport = sp.get("depAirport");
    result.arrAirport = sp.get("arrAirport");
    result.depDate = sp.get("depDate");
    result.retDate = sp.get("retDate");
    result.adult = sp.get("adult");
    result.child = sp.get("child");
    result.infant = sp.get("infant");
    result.cabin = sp.get("cabin");
  } catch (e) {
    // ignore
  }
  return result;
}

/******************************************************************
 *  INIT SALESFORCEINTERACTIONS + SITEMAP
 ******************************************************************/

SalesforceInteractions.init({
  cookieDomain: "airpaz.com",
  // consents bisa ditaruh di sini kalau kamu sudah punya CMP
  // consents: [...]
}).then(function () {
  const sitemapConfig = {
    /**********************************************************
     * GLOBAL CONFIG
     **********************************************************/
    global: {
      onActionEvent: function (event) {
        // kalau mau enrich user (email identity, dsb) taruh di sini
        return event;
      },
      contentZones: [{ name: "global_pop_up" }],
    },

    pageTypeDefault: {
      name: "default",
      interaction: {
        name: "Default Page",
      },
    },

    /**********************************************************
     * PAGE TYPES
     **********************************************************/
    pageTypes: [
      /******************************************************
       * 1. HOMEPAGE FLIGHT
       ******************************************************/
      {
        name: "homepage_flight",
        interaction: {
          name: "ViewHomepageFlight",
        },

        // bikin longgar: cukup ada hero section + search button
        isMatch: function () {
          var $ = SalesforceInteractions.cashDom;
          var hasHero = $("section.header").length > 0;
          var hasSearchBtn =
            $("button[data-testid='flightSearchForm-searchFlight-button']")
              .length > 0;
          return hasHero && hasSearchBtn;
        },

        contentZones: [
          {
            name: "homepage-hero",
            selector: "section.header",
          },
          {
            name: "homepage-flight-recos",
            selector:
              "div[data-testid='flightRecommendation-content-container']",
          },
        ],

        listeners: [
          // a) tombol SEARCH di hero
          SalesforceInteractions.listener(
            "click",
            "button[data-testid='flightSearchForm-searchFlight-button']",
            function () {
              var $ = SalesforceInteractions.cashDom;

              var originText =
                $(
                  "input[data-testid='flightAirportPicker-origin-input']"
                ).val() || "";
              var destinationText =
                $(
                  "input[data-testid='flightAirportPicker-destination-input']"
                ).val() || "";

              var departureDateText = $(
                "[data-testid='flightSearchForm-departure-datePicker']"
              )
                .text()
                .trim();
              var returnDateText = $(
                "[data-testid='flightSearchForm-return-datePicker']"
              )
                .text()
                .trim();

              var tripType = $(
                "button[data-testid='flightSearchForm-type-textButton']"
              )
                .text()
                .trim(); // Round Trip / One Way
              var cabinText = $(
                "button[data-testid='flightSearchForm-typeCabin-button']"
              )
                .text()
                .trim(); // Economy, etc.

              SalesforceInteractions.sendEvent({
                interaction: {
                  name: "Search Flight",
                },
                attributes: {
                  searchSource: "form",
                  originText: originText,
                  destinationText: destinationText,
                  departureDateText: departureDateText,
                  returnDateText: returnDateText,
                  tripType: tripType,
                  cabin: cabinText,
                },
              });
            }
          ),

          // b) klik promo card (Exclusive Flight Recommendations)
          SalesforceInteractions.listener(
            "click",
            "a[data-testid='flightRecommendation-navigate-card']",
            function (event, target) {
              var $target = SalesforceInteractions.cashDom(target);
              var href = $target.attr("href") || "";

              var q = parseFlightQueryFromUrl(href);

              var cityFrom = $target
                .find("div.text-xsmall, div.text-base")
                .first()
                .text()
                .trim();
              var cityTo = $target
                .find(".font-bold.truncate")
                .first()
                .text()
                .trim();

              SalesforceInteractions.sendEvent({
                interaction: {
                  name: "Search Flight Promo",
                },
                attributes: {
                  searchSource: "promoCard",
                  cardOriginCity: cityFrom,
                  cardDestinationCity: cityTo,
                  depAirport: q.depAirport,
                  arrAirport: q.arrAirport,
                  depDate: q.depDate,
                  retDate: q.retDate,
                  adult: q.adult,
                  child: q.child,
                  infant: q.infant,
                  cabin: q.cabin,
                },
              });
            }
          ),
        ],
      },

      /******************************************************
       * 2. FLIGHT SEARCH RESULTS (/flight/search)
       ******************************************************/
      {
        name: "flight_search_results",
        interaction: {
          name: "ViewFlightSearchResults",
        },

        isMatch: function () {
          return window.location.pathname.indexOf("/flight/search") >= 0;
        },

        listeners: [
          // nanti kalau mau, bisa tambah listener "Select Flight" di sini
        ],
      },

      /******************************************************
       * 4. LOGIN / REGISTER (drawer kanan & /en/login)
       ******************************************************/
      {
        name: "login_register",

        isMatch: function () {
          const hasSignInForm =
            SalesforceInteractions.cashDom("[data-testid='signIn-form']")
              .length > 0;
          const isLoginPath = window.location.pathname.indexOf("/login") >= 0;
          return hasSignInForm || isLoginPath;
        },

        interaction: {
          name: "View Login/Register",
        },

        listeners: [
          // 🔹 Klik tombol "Continue"
          SalesforceInteractions.listener(
            "click",
            "button[data-testid='signIn-button']",
            function () {
              const $ = SalesforceInteractions.cashDom;
              const email =
                $("input#email[data-testid='apzInput-email-text']").val() ||
                $("input[name='email']").val() ||
                "";

              if (email) {
                const trimmed = email.trim();

                SalesforceInteractions.sendEvent({
                  interaction: { name: "Submit Login/Register" },
                  user: {
                    // 🔥 INI YANG PENTING: identities.emailAddress
                    identities: {
                      emailAddress: trimmed,
                    },
                    // optional tapi membantu untuk cek di debug
                    attributes: {
                      emailAddress: trimmed,
                    },
                  },
                });

                console.log("📨 MCP login event sent with email:", trimmed);
              } else {
                console.warn("⚠️ Email empty on login submit");
              }
            }
          ),

          // opsional: Facebook/Google/Apple click … (boleh tetap pakai yang kemarin)
        ],
      },

      /******************************************************
       * 3. FLIGHT CONFIRM (/flight/confirm)
       *    - mapping ke Catalog Object Type: Product (Flight)
       ******************************************************/
      {
        name: "flight_confirm",

        isMatch: function () {
          return SalesforceInteractions.cashDom("[data-v-90f91c67]").length > 0;
        },

        interaction: {
          name: SalesforceInteractions.CatalogObjectInteractionName
            .ViewCatalogObject,
          catalogObject: {
            type: "Product",

            // ❗ gunakan resolveWhenTrue supaya nunggu sampai DOM siap
            id: function () {
              return SalesforceInteractions.util.resolveWhenTrue.bind(
                function () {
                  var id = buildFlightIdFromPage();
                  // kalau belum kebaca, balikin false → SDK akan coba lagi
                  return id && id.length ? id : false;
                }
              );
            },

            attributes: {
              name: SalesforceInteractions.util.resolveWhenTrue.bind(
                function () {
                  var info = getFlightBasicInfo();
                  if (info.departCityLabel && info.arriveCityLabel) {
                    return info.departCityLabel + " → " + info.arriveCityLabel;
                  }
                  return false;
                }
              ),

              url: SalesforceInteractions.resolvers.fromHref(),

              depAirport: SalesforceInteractions.resolvers.fromSelector(
                "p[data-testid='flightTimeline-depart_city-label']",
                function (label) {
                  label = (label || "").trim();
                  return extractCodeFromCityLabel(label);
                }
              ),

              arrAirport: SalesforceInteractions.resolvers.fromSelector(
                "p[data-testid='flightTimeline-arrival_city-label']",
                function (label) {
                  label = (label || "").trim();
                  return extractCodeFromCityLabel(label);
                }
              ),

              airline: SalesforceInteractions.resolvers.fromSelector(
                "p[data-testid='flightDetail-airline_name-label']",
                function (text) {
                  return (text || "").trim();
                }
              ),

              code: SalesforceInteractions.resolvers.fromSelector(
                "p[data-testid='flightDetail-airline_code-label']",
                function (text) {
                  return (text || "").trim();
                }
              ),

              imageUrl: SalesforceInteractions.resolvers.fromSelectorAttribute(
                "img.h-30", // ganti jika ada selector resmi seperti data-testid
                "src",
                (url) => {
                  if (!url) return null;
                  if (url.startsWith("http")) return url;
                  return window.location.origin + url;
                }
              ),

              // (opsional) kalau mau juga punya attribute category di Product
              category: SalesforceInteractions.util.resolveWhenTrue.bind(
                function () {
                  var info = getFlightBasicInfo();
                  if (!info.depAirport || !info.arrAirport) return false;
                  return getFlightCategoryFromAirports(
                    info.depAirport,
                    info.arrAirport
                  ); // "FLIGHT_DOMESTIC" / "FLIGHT_INTERNATIONAL"
                }
              ),
            },

            // 🔥 ini yang mirip contoh NTO: relatedCatalogObjects.Category
            relatedCatalogObjects: {
              Category: SalesforceInteractions.util.resolveWhenTrue.bind(
                function () {
                  var info = getFlightBasicInfo();
                  if (!info.depAirport || !info.arrAirport) return false;

                  var categoryId = getFlightCategoryFromAirports(
                    info.depAirport,
                    info.arrAirport
                  );

                  if (!categoryId) return false;

                  // HARUS array, contoh: ["FLIGHT_DOMESTIC"]
                  return [categoryId];
                }
              ),
              Brand: SalesforceInteractions.util.resolveWhenTrue.bind(
                function () {
                  var info = getFlightBasicInfo();
                  if (!info.airlineName) return false;

                  // HARUS array, contoh: ["FLIGHT_DOMESTIC"]
                  return [info.airlineName];
                }
              ),
            },
          },
        },

        listeners: [
          // Klik tombol Checkout di kanan
          SalesforceInteractions.listener(
            "click",
            "button[data-testid='flightConfirm-checkout-button']",
            function () {
              var info = getFlightBasicInfo();
              var totalPriceText = getTotalPriceText();

              var numericPrice = null;
              if (totalPriceText) {
                // "Rp 1.234.567" -> "1234567"
                var cleaned = totalPriceText.replace(/[^0-9]+/g, "");
                if (cleaned.length > 0) {
                  numericPrice = parseInt(cleaned, 10);
                }
              }

              var lineItem = {
                catalogObjectType: "Product",
                catalogObjectId: buildFlightIdFromPage(),
                quantity: 1,
                price: numericPrice,
              };

              console.log(lineItem);

              SalesforceInteractions.sendEvent({
                interaction: {
                  name: SalesforceInteractions.CartInteractionName.AddToCart,
                  lineItem: lineItem,
                },
                attributes: {
                  airline: info.airlineName,
                  code: info.flightCode,
                  depAirport: info.depAirport,
                  arrAirport: info.arrAirport,
                  duration: info.durationText,
                  totalPriceText: totalPriceText,
                },
              });
            }
          ),
        ],
      },
    ],
  };

  SalesforceInteractions.initSitemap(sitemapConfig);
});
