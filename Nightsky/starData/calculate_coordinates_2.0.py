import pandas as pd
import numpy as np


def main(file):
    gaia_file = pd.read_csv(file)
    gaia_file = gaia_file.rename(columns={"r_med_photogeo": "dist", "phot_rp_mean_mag": "rp", "phot_bp_mean_mag": "bp"})

    # Calculate coordinates from right ascension, declination and distance with given formula
    gaia_file = gaia_file.assign(x=lambda row: row.dist * np.cos(row.dec) * np.cos(row.ra))
    gaia_file = gaia_file.assign(y=lambda row: row.dist * np.cos(row.dec) * np.sin(row.ra))
    gaia_file = gaia_file.assign(z=lambda row: row.dist * np.sin(row.dec))

    # Normalize coordinates to fit in our space
    x_max = gaia_file["x"].abs().max()
    y_max = gaia_file["y"].abs().max()
    z_max = gaia_file["z"].abs().max()

    maximum = max(x_max, y_max, z_max)
    norm_factor = 10
    while maximum / norm_factor >= 1:
        norm_factor *= 10

    gaia_file = gaia_file.assign(x_norm=lambda row: row.x / norm_factor)
    gaia_file = gaia_file.assign(y_norm=lambda row: row.y / norm_factor)
    gaia_file = gaia_file.assign(z_norm=lambda row: row.z / norm_factor)

    # Calculate RGB values
    gaia_file = gaia_file.assign(R=lambda row: (row.rp / 100 * 255).astype("int"))
    gaia_file = gaia_file.assign(G=lambda row: ((100 - row.rp - row.bp) / 100 * 255).astype("int"))
    gaia_file = gaia_file.assign(B=lambda row: (row.bp / 100 * 255).astype("int"))

    # Name a few stars
    print("Find names:")
    gaia_file = gaia_file.assign(Name=lambda row: "")
    star_names = pd.read_csv("star names.csv", usecols=["IAU Name ", "RA(J2000)", "Dec(J2000)"])
    star_names = star_names.rename(columns={"IAU Name ": "Name", "RA(J2000)": "ra", "Dec(J2000)": "dec"})
    found_star_names = 0

    for index_gaia, row in gaia_file.iterrows():
        print(f"Processing star {index_gaia + 1} of {len(gaia_file)}", end="\r")
        for index_names, star in star_names.iterrows():
            if np.isclose(row["ra"], star["ra"], rtol=0.0001) and np.isclose(row["dec"], star["dec"], rtol=0.0001):
                gaia_file.at[index_gaia, "Name"] = star["Name"]
                found_star_names += 1

    print(f"\nFound {found_star_names} star names")

    gaia_file.to_csv(file.rstrip(".csv") + " full with names.csv", index=False)


if __name__ == "__main__":
    main("TOP 20000 bright.csv")
