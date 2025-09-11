import React from 'react'

const NavbarLogo: React.FC = () => {
  return (
    <a className="navbar__brand" aria-label="Homepage" href="/">
      <svg
        viewBox="0 0 140 100"
        width={26}
        height={26}
        preserveAspectRatio="xMidYMid"
        style={{ marginRight: 8, borderRadius: 6 }}
      >
        <path
          d="M76 67c-6 1-3-66-3-66s21 72 62 103c25 18-54-37-59-37zm-11 0c-5 0-84 55-59 37C48 73 69 1 69 1s2 67-4 66z"
          fill="currentColor"
        />
      </svg>
      <b className="navbar__title text--truncate">Skyhitz</b>
    </a>
  )
}

export default NavbarLogo


