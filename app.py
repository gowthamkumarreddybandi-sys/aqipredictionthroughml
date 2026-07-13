import streamlit as st

from src.auth import require_login
from src.services.city_data_service import (
    build_all_cities_cached,
    build_cities_json_cached,
    build_city_average_dataframe_cached,
    build_indian_cities,
)
from src.services.loaders import (
    load_city_coords,
    load_daily_data,
    load_eu_countries,
    load_ireland_coords,
    load_map_js,
    load_model,
    load_state_data,
)
from src.ui.charts import render_city_historical_chart, render_state_comparison_section
from src.ui.map_view import render_map_section
from src.ui.prediction import render_prediction_panel
from src.ui.sidebar import render_sidebar
from src.ui.styles import apply_page_config_and_styles


def initialize_dashboard_resources():
    """Initialize heavy dashboard resources only after successful authentication."""
    if "dashboard_resources" in st.session_state:
        return st.session_state.dashboard_resources

    resources = {}
    loading_placeholder = st.empty()

    try:
        with loading_placeholder.container():
            st.markdown("### Preparing your dashboard...")
            st.caption("Loading air quality data...")

        resources["model"] = load_model()
        resources["daily_df"] = load_daily_data()
        resources["daily_state_df"] = load_state_data(resources["daily_df"])
        resources["coord_df"] = load_city_coords()

        with loading_placeholder.container():
            st.markdown("### Preparing your dashboard...")
            st.caption("Almost ready...")

        resources["city_avg"] = build_city_average_dataframe_cached(resources["daily_df"])
        resources["city_df"] = build_indian_cities(resources["city_avg"], resources["coord_df"])
        resources["all_cities_list"] = sorted(resources["daily_df"]["City"].dropna().unique())
        resources["selected_city"] = resources["all_cities_list"][0] if resources["all_cities_list"] else None

        if "map" in st.session_state.get("allowed_features", set()):
            resources["ireland_df"] = load_ireland_coords()
            resources["eu_df"] = load_eu_countries()
            resources["all_cities"] = build_all_cities_cached(
                resources["city_df"],
                resources["ireland_df"],
                resources["eu_df"],
            )
            resources["cities_json"] = build_cities_json_cached(resources["all_cities"])
            resources["map_js"] = load_map_js()
        else:
            resources["ireland_df"] = None
            resources["eu_df"] = None
            resources["all_cities"] = None
            resources["cities_json"] = "[]"
            resources["map_js"] = ""

    finally:
        loading_placeholder.empty()

    st.session_state.dashboard_resources = resources
    return resources


apply_page_config_and_styles()


# ---------------- AUTH ----------------
current_user, current_role, allowed_features = require_login()


# ---------------- LOAD DATA (POST-AUTH ONLY) ----------------
st.session_state.allowed_features = allowed_features
resources = initialize_dashboard_resources()
model = resources["model"]
daily_df = resources["daily_df"]
daily_state_df = resources["daily_state_df"]
city_df = resources["city_df"]
cities_json = resources["cities_json"]
map_js = resources["map_js"]


# ---------------- SIDEBAR ----------------
render_sidebar(current_user=current_user, current_role=current_role)


# ---------------- HEADER ----------------
st.title("Air Quality Prediction & Live Monitoring")
st.caption(f"Logged in as **{current_user['username']}** | Role: **{current_role}**")

st.markdown(
    "**India**: Historical + Live AQI | "
    "**Ireland**: Live AQI per county | "
    "**EU**: Live AQI by capital city | "
    "**World**: Click for live data"
)


# ---------------- CITY SELECT ----------------
all_cities_list = resources["all_cities_list"]
selected_city = resources["selected_city"]


# ---------------- PREDICTION ----------------
render_prediction_panel(
    allowed_features=allowed_features,
    model=model,
    selected_city=selected_city,
    city_df=city_df,
)


# ---------------- MAP ----------------
render_map_section(
    allowed_features=allowed_features,
    cities_json=cities_json,
    selected_city=selected_city,
    map_js=map_js,
)


# ---------------- CITY-WISE HISTORICAL AQI ----------------
selected_city = render_city_historical_chart(
    allowed_features=allowed_features,
    daily_df=daily_df,
    all_cities_list=all_cities_list,
)


# ---------------- STATE COMPARISON ----------------
render_state_comparison_section(
    allowed_features=allowed_features,
    daily_state_df=daily_state_df,
)
