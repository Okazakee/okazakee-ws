import React from "react";
import Contacts from "../components/landing/Contacts";
import Blog from "../components/landing/Blog";
import Portfolio from "../components/landing/Portfolio";
import Skills from "../components/landing/Skills";
import Hero from "../components/landing/Hero";

export default async function Home() {

  //TODO placeholder data

  const heroArray = [
    {
      propic: "https://mtvwynyikouqzmhqespl.supabase.co/storage/v1/object/public/website/biography/propic.jpeg",
      name: "Cristian <label>Di Carlo</label>",
      position: "Fullstack Web <label>Developer</label>",
      sectionName: 'About Me',
      desc: "My name is <label>Cristian</label>, also known as Okazakee on the web. At <label>25</label> years old, I am a passionate <label>Web Developer</label> from <label>Italy</label>. From a young age, I have had a love for technology and have been heavily involved in the IT world. I am an avid supporter of <label>Open Source</label> and have experience in video editing and post production. However, in late 2021, I decided to shift my focus to Web Development. I am currently working on various personal projects and aim to become a good <label>Full Stack developer</label> in the near future. You can view my <label>portfolio</label> and find my social profiles to learn more about my skills and experience."
    }
  ];

  const skillsArray = [
    {
      sectionName: 'Skills & Tech Stack',
      subtitle: "This section outlines the <label className='text-main'>key technologies</label> and tools that I am proficient in",
      skillsSectons: [
        {
          category: 'Frontend',
          skills: [
            {
              invert: false,
              icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg',
              title: 'JavaScript'
            },
            {
              invert: false,
              icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg',
              title: 'TypeScript'
            },
            {
              invert: false,
              icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg',
              title: 'ReactJS'
            },
            {
              invert: true,
              icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nextjs/nextjs-plain.svg',
              title: 'NextJS'
            },
            {
              invert: false,
              icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg',
              title: 'HTML'
            },
            {
              invert: false,
              icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/tailwindcss/tailwindcss-original.svg',
              title: 'TailwindCSS'
            }
          ]
        },
        {
          category: 'Backend',
          skills: [
            {
              invert: true,
              icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg',
              title: 'ExpressJS'
            },
            {
              invert: false,
              icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg',
              title: 'PostgreSQL'
            },
            {
              invert: false,
              icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/mongodb/mongodb-original.svg',
              title: 'MongoDB'
            },
            {
              invert: false,
              icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nestjs/nestjs-original.svg',
              title: 'NestJS'
            }
          ]
        },
        {
          category: 'Tools',
          skills: [
            {
              invert: false,
              icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg',
              title: 'Git'
            },
            {
              invert: true,
              icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vercel/vercel-original.svg',
              title: 'Vercel'
            },
            {
              invert: false,
              icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/supabase/supabase-original.svg',
              title: 'Supabase'
            },
            {
              invert: false,
              icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/docker/docker-original.svg',
              title: 'Docker'
            },
            {
              invert: true,
              icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/bash/bash-original.svg',
              title: 'Bash'
            }
          ]
        }
      ]
    }
  ];

  const portfolioArray = [
    {
      sectionName: 'Portfolio',
      subtitle: "My portfolio showcases a <label>selection of projects</label> I have worked on. These projects cover a range of technologies and use cases and visitors can explore the <label>live deployments</label> of these projects and access the source code on GitHub",
      latestPosts: [
        {
          id: 1,
          title: 'Weather App',
          desc: "Welcome to the Weather-APP project, a web application that displays weather data for three different cities (dynamic features in the future). This project was developed as part of a front-end development test and utilizes various API service to retrieve real-time weather data.",
          imageLink: 'https://mtvwynyikouqzmhqespl.supabase.co/storage/v1/object/public/website/biography/test%20post.png',
        },
        {
          id: 2,
          title: 'Minecraft Servers w/ Lazymc',
          desc: "This is a Linux Docker image for creating Minecraft servers with lazymc. Lazymc is a utility that puts your Minecraft server to rest when idle and wakes it up when players try to connect. This allows the server to not waste resources if nobody is connected. This image provides a basic Minecraft server using one of the supported providers. All customizations are left to the user.",
          imageLink: 'https://mtvwynyikouqzmhqespl.supabase.co/storage/v1/object/public/website/biography/mc2.png',
        },
        {
          id: 3,
          title: 'ZTM-Coffee-Connoisseur Project',
          desc: "This is the first NextJS WebApp project committed from the ZTM NextJS Course. The WebApp lets you find coffee stores near your location (Palermo set as default). The user can navigate through various coffee stores gathering their information such as it's name or address and can leave a star to upvote the coffee store.",
          imageLink: 'https://mtvwynyikouqzmhqespl.supabase.co/storage/v1/object/public/website/biography/ztm.png',
        }
      ]
    }
  ];

  const blogArray = [
    {
      sectionName: 'Blog',
      subtitle: "Occasional posts on interesting web development <label>experiences</label> and insights",
      latestPosts: [
        {
          id: 1,
          title: 'BLOG POST 1',
          desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur...',
          imageLink: 'https://mtvwynyikouqzmhqespl.supabase.co/storage/v1/object/public/website/biography/blog1.jpg',
        },
        {
          id: 2,
          title: 'BLOG POST 2',
          desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur...',
          imageLink: 'https://mtvwynyikouqzmhqespl.supabase.co/storage/v1/object/public/website/biography/blog2.jpg',
        },
        {
          id: 3,
          title: 'BLOG POST 3',
          desc: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur...',
          imageLink: 'https://mtvwynyikouqzmhqespl.supabase.co/storage/v1/object/public/website/biography/blog3.jpg',
        }
      ]
    }
  ];

  const contactsArray = [
    {
      sectionName: 'Contacts',
      subtitle: "You can <label>reach out</label> to me through the following channels:",
      contacts: [
        {
          label: 'GitHub',
          icon: 'github',
          link: 'https://github.com/okazakee',
        },
        {
          label: 'LinkedIn',
          icon: 'linkedin',
          link: 'https://www.linkedin.com/in/okazakee',
        },
        {
          label: 'Telegram',
          icon: 'send',
          link: 'https://t.me/okazakee',
        },
        {
          label: 'Email',
          icon: 'MailPlus',
          link: 'mailto:okazakee@proton.me',
        },
      ]
    }
  ];

  return (
    <div className="mx-auto max-w-7xl">

      <Hero heroArray={heroArray[0]} />

      <Skills skillsArray={skillsArray[0]} />

      <Portfolio portfolioArray={portfolioArray[0]} />

      <Blog blogArray={blogArray[0]} />

      <Contacts contactsArray={contactsArray[0]} />

    </div>
  );
}