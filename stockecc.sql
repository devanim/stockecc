USE [stocks]
GO

/****** Object:  Table [dbo].[stockecc]    Script Date: 5/22/2022 3:07:36 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[stockecc](
	[Reference] [nvarchar](50) NULL,
	[Description] [nvarchar](255) NULL,
	[Brand] [nvarchar](50) NULL,
	[Stock] [int] NOT NULL,
	[Price] [float] NOT NULL,
	[CreatedDate] [datetime] NOT NULL,
	[BrandShort] [nvarchar](50) NULL
) ON [PRIMARY]
GO